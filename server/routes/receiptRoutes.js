const express = require('express');
const router = express.Router();
const {
  getReceipts,
  getReceiptById,
  recordReceiptPrint
} = require('../controllers/receiptController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getReceipts);
router.get('/:id', requireAuth, getReceiptById);
router.post('/:id/print', requireAuth, recordReceiptPrint);

module.exports = router;
