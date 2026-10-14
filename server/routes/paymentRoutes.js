const express = require('express');
const router = express.Router();
const {
  getPayments,
  getTodayCollections,
  cancelPayment
} = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getPayments);
router.get('/today', requireAuth, getTodayCollections);
router.delete('/:id', requireAuth, cancelPayment);

module.exports = router;
