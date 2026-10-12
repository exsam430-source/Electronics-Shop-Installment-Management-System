const express = require('express');
const router = express.Router();
const {
  checkSetupStatus,
  setupInitialAdmin,
  login,
  getMe,
  changePassword,
  recoverPassword
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.get('/setup-status', checkSetupStatus);
router.post('/setup', setupInitialAdmin);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);
router.post('/recover-password', recoverPassword);

module.exports = router;
