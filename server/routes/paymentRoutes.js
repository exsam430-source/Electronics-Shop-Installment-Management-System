const express = require('express');
const router = express.Router();
const {
  getPayments,
  getTodayCollections
} = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getPayments);
router.get('/today', requireAuth, getTodayCollections);

module.exports = router;
