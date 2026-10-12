const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function applyLogoEverywhere() {
  const sourceLogo = 'C:\\Users\\Sky\\Downloads\\Electronics Management System Logo.png';
  const rootDir = path.resolve(__dirname, '..');

  console.log('1. Reading logo from:', sourceLogo);
  if (!fs.existsSync(sourceLogo)) {
    throw new Error('Logo source not found at: ' + sourceLogo);
  }
  const logoBuffer = fs.readFileSync(sourceLogo);

  // 2. Ensure target folders
  const assetsDir = path.join(rootDir, 'src', 'assets');
  const publicDir = path.join(rootDir, 'public');
  const uploadsDir = path.join(rootDir, 'data', 'uploads');
  const releaseAppDir = path.join(rootDir, 'release', 'MR-SOLVER-Electronics-Shop-win32-x64', 'resources', 'app');
  const releaseRoot = path.join(rootDir, 'release', 'MR-SOLVER-Electronics-Shop-win32-x64');

  [assetsDir, publicDir, uploadsDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // 3. Save as icon.png and logo.png in project
  fs.writeFileSync(path.join(rootDir, 'icon.png'), logoBuffer);
  fs.writeFileSync(path.join(assetsDir, 'logo.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.png'), logoBuffer);
  fs.writeFileSync(path.join(uploadsDir, 'shop-logo.png'), logoBuffer);

  // 4. Generate Windows .ico file (PNG embedded inside ICO container)
  // An ICO header for 1 PNG image (256x256 or any dimensions):
  // Header: 0,0, 1,0 (type 1 for icon), 1,0 (1 image)
  // Entry: width(0 for 256), height(0 for 256), colors(0), reserved(0), planes(1,0), bpp(32,0), size(4 bytes), offset(4 bytes = 22)
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Count 1
  icoHeader.writeUInt8(0, 6);   // Width 256 (0 = 256)
  icoHeader.writeUInt8(0, 7);   // Height 256 (0 = 256)
  icoHeader.writeUInt8(0, 8);   // Palette 0
  icoHeader.writeUInt8(0, 9);   // Reserved
  icoHeader.writeUInt16LE(1, 10); // Color planes
  icoHeader.writeUInt16LE(32, 12); // Bits per pixel
  icoHeader.writeUInt32LE(logoBuffer.length, 14); // Image data size
  icoHeader.writeUInt32LE(22, 18); // Offset to image data

  const icoBuffer = Buffer.concat([icoHeader, logoBuffer]);
  fs.writeFileSync(path.join(rootDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuffer);

  // 5. Copy into release folder if it exists
  if (fs.existsSync(releaseRoot)) {
    fs.writeFileSync(path.join(releaseRoot, 'icon.ico'), icoBuffer);
    fs.writeFileSync(path.join(releaseRoot, 'icon.png'), logoBuffer);
    if (fs.existsSync(releaseAppDir)) {
      fs.writeFileSync(path.join(releaseAppDir, 'icon.png'), logoBuffer);
      fs.writeFileSync(path.join(releaseAppDir, 'icon.ico'), icoBuffer);
      const relUploads = path.join(releaseAppDir, 'data', 'uploads');
      if (!fs.existsSync(relUploads)) fs.mkdirSync(relUploads, { recursive: true });
      fs.writeFileSync(path.join(relUploads, 'shop-logo.png'), logoBuffer);
    }
  }

  console.log('2. Icon files created in root, assets, public, and release directories.');

  // 6. Update MongoDB Business Profile so logo is active in real database
  try {
    await mongoose.connect('mongodb://localhost:27017/electronics_shop_db');
    const BusinessProfile = require('../server/models/BusinessProfile');
    const base64Data = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    await BusinessProfile.findOneAndUpdate({}, {
      logo: base64Data
    }, { upsert: true });
    console.log('3. MongoDB Business Profile updated with embedded Logo in real-time!');
    await mongoose.disconnect();
  } catch (err) {
    console.warn('MongoDB profile update warning:', err.message);
  }

  console.log('4. Logo applied completely and successfully!');
}

applyLogoEverywhere().catch(err => {
  console.error('[Error applying logo]:', err);
  process.exit(1);
});
