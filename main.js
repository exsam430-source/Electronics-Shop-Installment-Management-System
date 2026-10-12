const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

async function ensureDatabaseRunning() {
  const isMongoRunning = await checkPortInUse(27017);
  if (isMongoRunning) {
    return true;
  }

  const candidates = [
    path.join(__dirname, 'bin', 'mongod.exe'),
    path.join(process.resourcesPath || '', 'bin', 'mongod.exe'),
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe'
  ];

  const foundMongod = candidates.find((c) => c && fs.existsSync(c));
  if (foundMongod) {
    const dbPath = path.join(__dirname, 'data', 'db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    try {
      mongoProcess = spawn(foundMongod, ['--dbpath', dbPath, '--port', '27017'], {
        windowsHide: true,
        stdio: 'ignore'
      });

      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 400));
        if (await checkPortInUse(27017)) {
          return true;
        }
      }
    } catch (e) {
      console.error('[Electron] Error starting mongod process:', e);
    }
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

async function waitForServer(port = 5000, maxAttempts = 35) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkServerReady(port);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startBackendServer() {
  const serverPath = path.join(__dirname, 'server', 'index.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: 5000, NODE_ENV: isDev ? 'development' : 'production' },
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

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  return new Promise((resolve) => {
    const printOptions = {
      silent: options.silent || false,
      printBackground: true,
      deviceName: options.deviceName || ''
    };

    if (options.marginsType !== undefined) {
      printOptions.marginsType = options.marginsType;
    }

    printWindow.webContents.print(printOptions, (success, failureReason) => {
      printWindow.close();
      if (!success) {
        resolve({ success: false, error: failureReason });
      } else {
        resolve({ success: true });
      }
    });
  });
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

// Desktop App Lifecycle
app.whenReady().then(async () => {
  await ensureDatabaseRunning();

  const isServerRunning = await checkServerReady(5000);
  if (!isServerRunning) {
    startBackendServer();
    await waitForServer(5000, 35);
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
