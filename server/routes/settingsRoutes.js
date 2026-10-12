const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateBusinessProfile,
  updateLateFeeSettings,
  updateAutoBackupSettings,
  getActivityLogs
} = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getSettings);
router.put('/profile', requireAuth, updateBusinessProfile);
router.put('/late-fee', requireAuth, updateLateFeeSettings);
router.put('/auto-backup', requireAuth, updateAutoBackupSettings);
router.get('/activity-logs', requireAuth, getActivityLogs);

module.exports = router;
