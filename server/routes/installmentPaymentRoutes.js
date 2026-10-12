const express = require('express');
const router = express.Router();
const {
  getInstallmentAccounts,
  recordInstallmentPayment,
  getOverdueInstallments
} = require('../controllers/installmentPaymentController');
const { requireAuth } = require('../middleware/auth');

router.get('/accounts', requireAuth, getInstallmentAccounts);
router.post('/record', requireAuth, recordInstallmentPayment);
router.get('/overdue', requireAuth, getOverdueInstallments);

module.exports = router;
