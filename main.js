const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { fork, spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
let mongoProcess = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function checkPortInUse(port = 27017) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function resolveDataDirectory() {
  const isPackaged = app.isPackaged;
  const localDataDir = path.join(isPackaged ? path.dirname(process.execPath) : __dirname, 'data');

  try {
    // Check if local folder is writable (portable mode)
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    const testFile = path.join(localDataDir, '.perm_test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return localDataDir;
  } catch (err) {
    // Fallback to AppData roaming if local folder is read-only (e.g. C:\Program Files)
    const appDataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    return appDataDir;
  }
}

async function ensureDatabaseRunning(dataDir) {
  const isMongoRunning = await checkPortInUse(27017);
  if (isMongoRunning) {
    console.log('[Electron] MongoDB is already active on port 27017.');
    return true;
  }

  const appRoot = app.isPackaged ? path.dirname(process.execPath) : __dirname;
  const candidates = [
    path.join(__dirname, 'bin', 'mongod.exe'),
    path.join(__dirname, '..', 'bin', 'mongod.exe'),
    path.join(appRoot, 'bin', 'mongod.exe'),
    path.join(appRoot, 'resources', 'app', 'bin', 'mongod.exe'),
    path.join(process.resourcesPath || '', 'bin', 'mongod.exe'),
    path.join(process.resourcesPath || '', 'app', 'bin', 'mongod.exe'),
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe'
  ];

  const foundMongod = candidates.find((c) => c && fs.existsSync(c));
  if (!foundMongod) {
    console.warn('[Electron] No mongod binary found in bundle or system paths.');
    return false;
  }

  const dbPath = path.join(dataDir, 'db');
  const logsDir = path.join(dataDir, 'logs');
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  // Auto-recovery: clean stale lock file from unexpected power cuts or unclean shutdowns
  const lockFile = path.join(dbPath, 'mongod.lock');
  if (fs.existsSync(lockFile)) {
    try {
      console.log('[Electron] Prior lock file detected. Running repair and clearing lock...');
      const { spawnSync } = require('child_process');
      spawnSync(foundMongod, ['--repair', '--dbpath', dbPath], {
        cwd: path.dirname(foundMongod),
        windowsHide: true,
        timeout: 10000
      });
      if (fs.existsSync(lockFile)) {
        try { fs.unlinkSync(lockFile); } catch (e) { fs.writeFileSync(lockFile, ''); }
      }
    } catch (e) {
      console.warn('[Electron] Lock recovery warning:', e.message);
      try { fs.unlinkSync(lockFile); } catch (e2) {}
    }
  }

  try {
    const logFile = path.join(logsDir, 'mongodb.log');
    const logFd = fs.openSync(logFile, 'a');

    console.log(`[Electron] Launching embedded MongoDB from: ${foundMongod}`);
    console.log(`[Electron] Database Storage Path: ${dbPath}`);

    mongoProcess = spawn(
      foundMongod,
      ['--dbpath', dbPath, '--port', '27017', '--bind_ip', '127.0.0.1'],
      {
        cwd: path.dirname(foundMongod), // Crucial: loads VC++ DLLs located in bin/
        windowsHide: true,
        stdio: ['ignore', logFd, logFd]
      }
    );

    mongoProcess.on('exit', (code) => {
      console.log(`[Electron] MongoDB process exited with code ${code}`);
    });

    // Wait for MongoDB to listen on port 27017
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (await checkPortInUse(27017)) {
        console.log('[Electron] Embedded MongoDB successfully started and ready.');
        return true;
      }
    }
  } catch (e) {
    console.error('[Electron] Failed to start mongod process:', e);
  }

  return false;
}

function checkServerReady(port = 5000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      if (res.statusCode === 200) resolve(true);
      else resolve(false);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port = 5000, maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkServerReady(port);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startBackendServer(dataDir) {
  const serverPath = path.join(__dirname, 'server', 'index.js');
  serverProcess = fork(serverPath, [], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: 5000,
      DATA_DIR: dataDir,
      NODE_ENV: isDev ? 'development' : 'production'
    },
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to start backend server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    title: 'MR SOLVER Electronics Shop & Installment Manager',
    backgroundColor: '#0b1120',
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Load the desktop application served by internal offline Express engine
  if (isDev && process.env.VITE_DEV) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL('http://localhost:5000');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('print-receipt', async (event, htmlContent, options = {}) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Ensure DOM layout and inline styles are fully painted
    await new Promise((r) => setTimeout(r, 300));

    return await new Promise((resolve) => {
      const printOptions = {
        silent: options.silent || false,
        printBackground: true,
        deviceName: options.deviceName || ''
      };

      if (options.marginsType !== undefined) {
        printOptions.marginsType = options.marginsType;
      }

      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!printWindow.isDestroyed()) printWindow.close();
        if (!success) {
          resolve({ success: false, error: failureReason });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (err) {
    if (!printWindow.isDestroyed()) printWindow.close();
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-pdf', async (event, htmlContent, options = {}) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    await new Promise((r) => setTimeout(r, 350));

    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: options.pageSize || 'A4',
      preferCSSPageSize: true
    });

    if (!printWindow.isDestroyed()) printWindow.close();

    const defaultFilename = options.filename || `Document_${Date.now()}.pdf`;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Document as PDF',
      defaultPath: path.join(app.getPath('documents'), defaultFilename),
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (err) {
    if (!printWindow.isDestroyed()) printWindow.close();
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('set-window-title', (event, title) => {
  if (mainWindow && title) {
    mainWindow.setTitle(`${title} — Electronics Shop & Installment Manager`);
  }
});

// WhatsApp Handlers (Direct Desktop App & Inside-App Web Window)
let whatsAppWindow = null;

ipcMain.handle('open-whatsapp-app', async (event, { phone, text }) => {
  try {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text || '')}`;
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    console.error('[Electron] Open WhatsApp App error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-whatsapp-web', async (event, { phone, text }) => {
  try {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text || '')}`;

    if (whatsAppWindow && !whatsAppWindow.isDestroyed()) {
      whatsAppWindow.focus();
      whatsAppWindow.loadURL(url);
      return { success: true };
    }

    whatsAppWindow = new BrowserWindow({
      width: 1080,
      height: 780,
      minWidth: 800,
      minHeight: 600,
      title: 'WhatsApp Web — MR SOLVER Electronics',
      backgroundColor: '#111b21',
      icon: path.join(__dirname, 'icon.png'),
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    whatsAppWindow.setMenuBarVisibility(false);

    // Modern Chrome User Agent so WhatsApp Web NEVER shows "Chrome is older / unsupported" error!
    const modernChromeUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    whatsAppWindow.webContents.setUserAgent(modernChromeUA);

    whatsAppWindow.loadURL(url);

    whatsAppWindow.on('closed', () => {
      whatsAppWindow = null;
    });

    return { success: true };
  } catch (err) {
    console.error('[Electron] Open WhatsApp Web error:', err);
    return { success: false, error: err.message };
  }
});

// Desktop App Lifecycle
app.whenReady().then(async () => {
  const dataDir = resolveDataDirectory();
  console.log(`[Electron] Active Data Storage Directory: ${dataDir}`);

  await ensureDatabaseRunning(dataDir);

  const isServerRunning = await checkServerReady(5000);
  if (!isServerRunning) {
    startBackendServer(dataDir);
    await waitForServer(5000, 45);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
  }
  if (mongoProcess) {
    try {
      mongoProcess.kill();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
