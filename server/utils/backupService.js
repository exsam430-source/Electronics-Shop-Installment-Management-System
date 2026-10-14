const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const cron = require('node-cron');
const BackupLog = require('../models/BackupLog');
const BusinessProfile = require('../models/BusinessProfile');

// Models to export in backup
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const ReferralPartner = require('../models/ReferralPartner');
const CashSale = require('../models/CashSale');
const InstallmentSale = require('../models/InstallmentSale');
const InstallmentSchedule = require('../models/InstallmentSchedule');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Commission = require('../models/Commission');
const CommissionPayment = require('../models/CommissionPayment');
const Return = require('../models/Return');
const Warranty = require('../models/Warranty');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');

const getAllModelsMap = () => ({
  User,
  BusinessProfile,
  Category,
  Product,
  ProductUnit,
  Supplier,
  Purchase,
  Customer,
  ReferralPartner,
  CashSale,
  InstallmentSale,
  InstallmentSchedule,
  Payment,
  Receipt,
  Commission,
  CommissionPayment,
  Return,
  Warranty,
  Settings,
  ActivityLog
});

/**
 * Resolve safe backup directory that is guaranteed writable
 */
const resolveSafeBackupDir = (customDestPath = null, profile = null) => {
  if (customDestPath && path.isAbsolute(customDestPath)) {
    try {
      if (!fs.existsSync(customDestPath)) fs.mkdirSync(customDestPath, { recursive: true });
      return customDestPath;
    } catch (e) {}
  }

  if (profile && profile.autoBackup && profile.autoBackup.backupPath) {
    const p = profile.autoBackup.backupPath;
    if (path.isAbsolute(p)) {
      try {
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
      } catch (e) {}
    }
  }

  const baseDataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
  const target = path.join(baseDataDir, 'backups');

  try {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    return target;
  } catch (e) {
    const userDocs = path.join(process.env.USERPROFILE || 'C:', 'Documents', 'MR-SOLVER-Backups');
    try {
      fs.mkdirSync(userDocs, { recursive: true });
      return userDocs;
    } catch (err2) {
      return path.join(baseDataDir);
    }
  }
};

/**
 * Creates a complete database snapshot compressed in .eshop_backup format
 */
const createBackup = async (type = 'manual', customDestPath = null) => {
  try {
    const profile = await BusinessProfile.findOne();
    const backupDir = resolveSafeBackupDir(customDestPath, profile);

    const models = getAllModelsMap();
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      shopName: profile ? profile.shopName : 'MR SOLVER Electronics',
      collections: {}
    };

    for (const [name, model] of Object.entries(models)) {
      const records = await model.find().lean();
      backupData.collections[name] = records;
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${timestampStr}_${type}.eshop_backup`;
    const fullPath = path.join(backupDir, fileName);

    const jsonStr = JSON.stringify(backupData);
    const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'));
    fs.writeFileSync(fullPath, compressed);

    const stats = fs.statSync(fullPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2) + ' KB';

    await BackupLog.create({
      backupDate: new Date(),
      backupPath: fullPath,
      backupSize: fileSizeKB,
      backupType: type,
      status: 'success',
      notes: `Exported ${Object.keys(backupData.collections).length} collections.`
    });

    // Cleanup old backups if retention limit configured
    const keepLast = (profile && profile.autoBackup && profile.autoBackup.keepLast) || 12;
    cleanupOldBackups(backupDir, keepLast);

    return {
      success: true,
      filePath: fullPath,
      fileName,
      size: fileSizeKB
    };
  } catch (error) {
    console.error('[Backup Error]:', error.message);
    await BackupLog.create({
      backupDate: new Date(),
      backupPath: customDestPath || 'unknown',
      backupSize: '0 KB',
      backupType: type,
      status: 'failed',
      notes: error.message
    });
    throw error;
  }
};

/**
 * Restore data from a .eshop_backup or .json backup file (path or raw buffer)
 */
const restoreBackup = async (filePathOrBuffer) => {
  try {
    let fileBuffer;
    let label = 'uploaded backup';

    if (Buffer.isBuffer(filePathOrBuffer)) {
      fileBuffer = filePathOrBuffer;
    } else {
      let resolvedPath = filePathOrBuffer;
      if (!fs.existsSync(resolvedPath)) {
        // Try searching in backup directory
        const backupDir = resolveSafeBackupDir();
        const candidate = path.join(backupDir, path.basename(resolvedPath));
        if (fs.existsSync(candidate)) {
          resolvedPath = candidate;
        } else {
          throw new Error(`Backup file does not exist at: ${filePathOrBuffer}`);
        }
      }
      label = path.basename(resolvedPath);
      fileBuffer = fs.readFileSync(resolvedPath);
    }

    let parsedData;
    try {
      const decompressed = zlib.gunzipSync(fileBuffer);
      parsedData = JSON.parse(decompressed.toString('utf-8'));
    } catch (e) {
      // Try parsing as plain JSON
      parsedData = JSON.parse(fileBuffer.toString('utf-8'));
    }

    if (!parsedData || !parsedData.collections) {
      throw new Error('Invalid backup file structure: missing collections data.');
    }

    const models = getAllModelsMap();

    // Clear and restore each collection
    for (const [name, records] of Object.entries(parsedData.collections)) {
      if (models[name]) {
        await models[name].deleteMany({});
        if (records && records.length > 0) {
          await models[name].insertMany(records);
        }
      }
    }

    return {
      success: true,
      message: `Database successfully restored from ${label}`,
      collectionsRestored: Object.keys(parsedData.collections).length
    };
  } catch (error) {
    console.error('[Restore Error]:', error.message);
    throw error;
  }
};

/**
 * Remove oldest backups exceeding max count
 */
const cleanupOldBackups = (dirPath, maxCount) => {
  try {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.eshop_backup'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(dirPath, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxCount) {
      const filesToDelete = files.slice(maxCount);
      for (const file of filesToDelete) {
        fs.unlinkSync(path.join(dirPath, file.name));
      }
    }
  } catch (err) {
    console.error('[Cleanup Backups Error]:', err.message);
  }
};

let scheduledBackupJob = null;

const setupAutoBackupSchedule = async () => {
  try {
    const profile = await BusinessProfile.findOne();
    if (!profile || !profile.autoBackup || !profile.autoBackup.enabled) {
      if (scheduledBackupJob) {
        scheduledBackupJob.stop();
        scheduledBackupJob = null;
      }
      return;
    }

    const { frequency, day, time } = profile.autoBackup;
    const [hourStr, minStr] = (time || '23:00').split(':');
    const minute = parseInt(minStr, 10) || 0;
    const hour = parseInt(hourStr, 10) || 23;

    let cronExp = `${minute} ${hour} * * *`; // Default daily
    if (frequency === 'weekly') {
      const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
      const dayNum = dayMap[day] !== undefined ? dayMap[day] : 1;
      cronExp = `${minute} ${hour} * * ${dayNum}`;
    } else if (frequency === 'monthly') {
      cronExp = `${minute} ${hour} 1 * *`;
    }

    if (scheduledBackupJob) {
      scheduledBackupJob.stop();
    }

    scheduledBackupJob = cron.schedule(cronExp, async () => {
      console.log(`[AutoBackup] Triggering scheduled ${frequency} backup at ${new Date().toISOString()}`);
      try {
        await createBackup('auto');
      } catch (e) {
        console.error('[AutoBackup Execution Failed]:', e.message);
      }
    });

    console.log(`[AutoBackup] Initialized schedule (${frequency}): "${cronExp}"`);
  } catch (err) {
    console.error('[Setup AutoBackup Error]:', err.message);
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  setupAutoBackupSchedule
};
