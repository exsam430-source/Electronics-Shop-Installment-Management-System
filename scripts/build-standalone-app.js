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

  console.log('Step 7: Bundling local MongoDB engine (bin/mongod.exe)...');
  const binDir = path.join(appDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  const systemMongod = 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe';
  if (fs.existsSync(systemMongod)) {
    fs.copyFileSync(systemMongod, path.join(binDir, 'mongod.exe'));
    console.log('Copied mongod.exe to bundled app bin/');
  }

  console.log('Step 8: Creating quick-launch desktop runner in release root...');
  const launcherContent = `@echo off
start "" "%~dp0MR-SOLVER-Electronics-Shop.exe"
`;
  fs.writeFileSync(path.join(releaseDir, 'Launch-App.bat'), launcherContent);

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
