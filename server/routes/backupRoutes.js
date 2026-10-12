const express = require('express');
const router = express.Router();
const {
  triggerManualBackup,
  getBackupLogs,
  restoreFromBackup
} = require('../controllers/backupController');
const { requireAuth } = require('../middleware/auth');

router.post('/manual', requireAuth, triggerManualBackup);
router.get('/logs', requireAuth, getBackupLogs);
router.post('/restore', requireAuth, restoreFromBackup);

module.exports = router;
