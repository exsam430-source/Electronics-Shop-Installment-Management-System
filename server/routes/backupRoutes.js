const express = require('express');
const router = express.Router();
const {
  triggerManualBackup,
  getBackupLogs,
  restoreFromBackup,
  downloadBackupFile,
  uploadAndRestoreBackup
} = require('../controllers/backupController');
const { requireAuth } = require('../middleware/auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/manual', requireAuth, triggerManualBackup);
router.get('/logs', requireAuth, getBackupLogs);
router.post('/restore', requireAuth, restoreFromBackup);
router.get('/download/:fileName', requireAuth, downloadBackupFile);
router.post('/upload-restore', requireAuth, upload.single('backupFile'), uploadAndRestoreBackup);

module.exports = router;
