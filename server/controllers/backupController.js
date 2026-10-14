const path = require('path');
const fs = require('fs');
const BackupLog = require('../models/BackupLog');
const { createBackup, restoreBackup } = require('../utils/backupService');
const { logActivity } = require('../middleware/activityLogger');

const triggerManualBackup = async (req, res) => {
  try {
    const result = await createBackup('manual');
    await logActivity(req, 'backup', 'backup', `Created manual backup ${result.fileName}`);

    return res.json({
      success: true,
      message: 'Backup created successfully!',
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBackupLogs = async (req, res) => {
  try {
    const logs = await BackupLog.find().sort({ backupDate: -1 });
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const restoreFromBackup = async (req, res) => {
  try {
    const { backupPath } = req.body;
    if (!backupPath) {
      return res.status(400).json({ success: false, message: 'Backup file path is required.' });
    }

    const result = await restoreBackup(backupPath);
    await logActivity(req, 'update', 'backup', `Database restored from ${path.basename(backupPath)}`);

    return res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const downloadBackupFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    if (!fileName) {
      return res.status(400).json({ success: false, message: 'File name is required.' });
    }

    // Sanitize filename
    const safeName = path.basename(fileName);
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
    const primaryDir = path.join(dataDir, 'backups');
    const userDocs = path.join(process.env.USERPROFILE || 'C:', 'Documents', 'MR-SOLVER-Backups');

    let fullPath = path.join(primaryDir, safeName);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(userDocs, safeName);
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found on disk.' });
    }

    return res.download(fullPath, safeName);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const uploadAndRestoreBackup = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload a valid .eshop_backup file.' });
    }

    const result = await restoreBackup(req.file.buffer);
    await logActivity(req, 'update', 'backup', `Database restored from uploaded file ${req.file.originalname}`);

    return res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  triggerManualBackup,
  getBackupLogs,
  restoreFromBackup,
  downloadBackupFile,
  uploadAndRestoreBackup
};
