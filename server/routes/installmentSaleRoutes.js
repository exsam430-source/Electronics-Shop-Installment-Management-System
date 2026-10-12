const express = require('express');
const router = express.Router();
const {
  getInstallmentSales,
  getInstallmentSaleById,
  createInstallmentSale
} = require('../controllers/installmentSaleController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getInstallmentSales);
router.get('/:id', requireAuth, getInstallmentSaleById);
router.post('/', requireAuth, createInstallmentSale);

module.exports = router;
