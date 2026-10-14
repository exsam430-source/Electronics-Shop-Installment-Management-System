const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateBusinessProfile,
  updateLateFeeSettings,
  updateAutoBackupSettings,
  getActivityLogs
} = require('../controllers/settingsController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/', getSettings);
router.put('/profile', optionalAuth, updateBusinessProfile);
router.put('/late-fee', optionalAuth, updateLateFeeSettings);
router.put('/auto-backup', optionalAuth, updateAutoBackupSettings);
router.get('/activity-logs', optionalAuth, getActivityLogs);

module.exports = router;
