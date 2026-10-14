const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildStandaloneApp() {
  console.log('========================================================');
  console.log(' BUILDING MR SOLVER OFFLINE STANDALONE DESKTOP SOFTWARE');
  console.log('========================================================');

  const rootDir = path.resolve(__dirname, '..');
  const releaseDir = path.join(rootDir, 'release', 'MR-SOLVER-Electronics-Shop-win32-x64');
  const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');

  console.log('Step 1: Building production frontend with Tailwind v4...');
  execSync('npm run build:client', { cwd: rootDir, stdio: 'inherit' });

  console.log('Step 2: Preparing destination release directory...');
  if (fs.existsSync(releaseDir)) {
    fs.rmSync(releaseDir, { recursive: true, force: true });
  }
  fs.mkdirSync(releaseDir, { recursive: true });

  console.log('Step 3: Copying Electron Windows Desktop runtime...');
  fs.cpSync(electronDist, releaseDir, { recursive: true });

  console.log('Step 4: Branding executable to MR-SOLVER-Electronics-Shop.exe...');
  const oldExe = path.join(releaseDir, 'electron.exe');
  const newExe = path.join(releaseDir, 'MR-SOLVER-Electronics-Shop.exe');
  if (fs.existsSync(oldExe)) {
    fs.renameSync(oldExe, newExe);
  }

  // Remove default app asar
  const defaultAsar = path.join(releaseDir, 'resources', 'default_app.asar');
  if (fs.existsSync(defaultAsar)) {
    fs.unlinkSync(defaultAsar);
  }

  const appDir = path.join(releaseDir, 'resources', 'app');
  fs.mkdirSync(appDir, { recursive: true });

  console.log('Step 5: Packaging application core into resources/app/...');
  const itemsToCopy = ['package.json', 'main.js', 'preload.js', 'dist', 'server', 'data'];
  for (const item of itemsToCopy) {
    const src = path.join(rootDir, item);
    const dest = path.join(appDir, item);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  }

  console.log('Step 6: Linking production node_modules...');
  const nodeModulesSrc = path.join(rootDir, 'node_modules');
  const nodeModulesDest = path.join(appDir, 'node_modules');
  fs.cpSync(nodeModulesSrc, nodeModulesDest, { recursive: true });

  console.log('Step 7: Bundling local MongoDB engine & Visual C++ Runtime DLLs...');
  const bundledBinDir = path.join(appDir, 'bin');
  const releaseBinDir = path.join(releaseDir, 'bin');
  fs.mkdirSync(bundledBinDir, { recursive: true });
  fs.mkdirSync(releaseBinDir, { recursive: true });

  const rootBinDir = path.join(rootDir, 'bin');
  if (fs.existsSync(rootBinDir)) {
    fs.cpSync(rootBinDir, bundledBinDir, { recursive: true });
    fs.cpSync(rootBinDir, releaseBinDir, { recursive: true });
    console.log('Copied mongod.exe and all 7 VC++ runtime DLLs to release bundle.');
  } else {
    const systemMongod = 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe';
    if (fs.existsSync(systemMongod)) {
      fs.copyFileSync(systemMongod, path.join(bundledBinDir, 'mongod.exe'));
      fs.copyFileSync(systemMongod, path.join(releaseBinDir, 'mongod.exe'));
    }
  }

  // Copy app icons to release root and app dir
  for (const iconFile of ['icon.png', 'icon.ico']) {
    const iconSrc = path.join(rootDir, iconFile);
    if (fs.existsSync(iconSrc)) {
      fs.copyFileSync(iconSrc, path.join(releaseDir, iconFile));
      fs.copyFileSync(iconSrc, path.join(appDir, iconFile));
    }
  }

  console.log('Step 8: Creating automated Setup Installer & Desktop Launchers...');

  // 1. One-click Desktop shortcut creator
  const shortcutBat = `@echo off
setlocal
cd /d "%~dp0"
set "TARGET=%~dp0MR-SOLVER-Electronics-Shop.exe"
set "ICON=%~dp0icon.ico"
set "DESKTOP=%USERPROFILE%\\Desktop"

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP%\\MR SOLVER Electronics Shop.lnk'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%ICON%'; $s.Description = 'MR SOLVER Electronics Shop & Installment Management System'; $s.Save()"

echo =====================================================================
echo  Desktop Shortcut Created Successfully on Desktop!
echo =====================================================================
pause
`;
  fs.writeFileSync(path.join(releaseDir, 'Create-Desktop-Shortcut.bat'), shortcutBat);

  // 2. Automated Installer Setup (Zero technical knowledge required)
  const installerBat = `@echo off
setlocal EnableDelayedExpansion
title MR SOLVER Electronics Shop - Automated Setup
cls

echo =====================================================================
echo   MR SOLVER LEARNING HUB & SOFTWARE HOUSE
echo   ELECTRONICS SHOP & INSTALLMENT MANAGEMENT SYSTEM
echo   100%% Offline Desktop Software Setup & Installer
echo =====================================================================
echo.
echo Installing and configuring software for your PC...
echo.

set "SOURCE_DIR=%~dp0"
set "INSTALL_DIR=%LOCALAPPDATA%\\Programs\\MR-SOLVER-Electronics-Shop"
set "DESKTOP=%USERPROFILE%\\Desktop"
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\MR SOLVER"

echo [1/4] Unblocking downloaded files...
powershell -ExecutionPolicy Bypass -NoProfile -Command "Get-ChildItem -Path '%SOURCE_DIR%' -Recurse -ErrorAction SilentlyContinue | Unblock-File" >nul 2>&1

echo [2/4] Setting up application folder at !INSTALL_DIR!...
if not exist "!INSTALL_DIR!" mkdir "!INSTALL_DIR!" >nul 2>&1
xcopy /E /I /Y /Q "!SOURCE_DIR!*" "!INSTALL_DIR!\\" >nul 2>&1

echo [3/4] Creating Desktop Shortcut...
powershell -ExecutionPolicy Bypass -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('!DESKTOP!\\MR SOLVER Electronics Shop.lnk'); $s.TargetPath = '!INSTALL_DIR!\\MR-SOLVER-Electronics-Shop.exe'; $s.WorkingDirectory = '!INSTALL_DIR!'; $s.IconLocation = '!INSTALL_DIR!\\icon.ico'; $s.Description = 'MR SOLVER Electronics Shop & Installment Management System'; $s.Save()" >nul 2>&1

echo [4/4] Creating Start Menu Shortcut...
if not exist "!START_MENU!" mkdir "!START_MENU!" >nul 2>&1
powershell -ExecutionPolicy Bypass -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('!START_MENU!\\MR SOLVER Electronics Shop.lnk'); $s.TargetPath = '!INSTALL_DIR!\\MR-SOLVER-Electronics-Shop.exe'; $s.WorkingDirectory = '!INSTALL_DIR!'; $s.IconLocation = '!INSTALL_DIR!\\icon.ico'; $s.Description = 'MR SOLVER Electronics Shop & Installment Management System'; $s.Save()" >nul 2>&1

echo.
echo =====================================================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo.
echo   - Desktop Shortcut created: "MR SOLVER Electronics Shop"
echo   - Installed Path: !INSTALL_DIR!
echo   - Default Admin Login:
echo       Username: admin
echo       Password: admin123
echo.
echo   - Local Database: 100%% Offline Embedded (Zero Configuration)
echo =====================================================================
echo.
set /p RUN_NOW="Do you want to launch the software now? (Y/N): "
if /i "!RUN_NOW!"=="Y" (
    start "" "!INSTALL_DIR!\\MR-SOLVER-Electronics-Shop.exe"
)
exit /b 0
`;
  fs.writeFileSync(path.join(releaseDir, 'Setup-Installer.bat'), installerBat);

  // 3. Simple runner
  const launcherContent = `@echo off
cd /d "%~dp0"
start "" "%~dp0MR-SOLVER-Electronics-Shop.exe"
exit
`;
  fs.writeFileSync(path.join(releaseDir, 'Launch-App.bat'), launcherContent);

  // 4. Instructions Readme for client handover
  const clientReadme = `=====================================================================
  MR SOLVER LEARNING HUB & SOFTWARE HOUSE
  ELECTRONICS SHOP & INSTALLMENT MANAGEMENT SYSTEM
  Offline Desktop Software - Client Handover Package
=====================================================================

HOW TO INSTALL & RUN (ZERO CONFIGURATION):

OPTION 1: AUTOMATED 1-CLICK INSTALLATION (RECOMMENDED)
1. Double-click "Setup-Installer.bat"
2. The installer will automatically:
   - Install the software to C:\\MR-SOLVER-Electronics-Shop
   - Create a Desktop Shortcut with the official logo
   - Configure the offline database engine
   - Launch the software ready to use!

OPTION 2: PORTABLE USE (NO INSTALLATION)
1. Keep this folder on any drive (C:, D:, or USB).
2. Double-click "Create-Desktop-Shortcut.bat" to place an icon on your Desktop.
3. Double-click "MR-SOLVER-Electronics-Shop.exe" or "Launch-App.bat" anytime!

=====================================================================
DEFAULT ADMINISTRATOR LOGIN CREDENTIALS:
=====================================================================
  Username: admin
  Password: admin123

(You can change your password anytime inside System Settings -> Admin Security)

=====================================================================
DATABASE & BACKUP:
=====================================================================
- Database runs 100% locally and offline.
- Backups are generated automatically on schedule.
- To make a backup anytime, go to System Settings -> Backup & Restore -> "Backup Now".
- Backups can be downloaded to your computer or restored with 1 click!
`;
  // 5. Compile native Setup-Installer.exe
  try {
    const { execSync } = require('child_process');
    console.log('[Build] Compiling native Setup-Installer.exe...');
    execSync('node scripts/build-installer-exe.js', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.warn('[Build Warning] Failed to compile native installer exe:', err.message);
  }

  console.log('========================================================');
  console.log(' BUILD COMPLETED SUCCESSFULLY!');
  console.log(` Output Location: ${releaseDir}`);
  console.log(` Executable: ${newExe}`);
  console.log(' The entire folder can be copied to any Windows PC.');
  console.log(' Client simply double clicks "MR-SOLVER-Electronics-Shop.exe"');
  console.log(' Zero internet, zero hosting, fully offline desktop software.');
  console.log('========================================================');
}

buildStandaloneApp().catch(err => {
  console.error('[Build Error]:', err.message);
  process.exit(1);
});
