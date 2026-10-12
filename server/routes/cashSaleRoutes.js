const express = require('express');
const router = express.Router();
const {
  getCashSales,
  getCashSaleById,
  createCashSale
} = require('../controllers/cashSaleController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getCashSales);
router.get('/:id', requireAuth, getCashSaleById);
router.post('/', requireAuth, createCashSale);

module.exports = router;
