const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getCollectionReport,
  getStockReport,
  getProfitReport,
  getMonthlyBusinessSummary
} = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.get('/sales', requireAuth, getSalesReport);
router.get('/collections', requireAuth, getCollectionReport);
router.get('/stock', requireAuth, getStockReport);
router.get('/profit', requireAuth, getProfitReport);
router.get('/monthly-summary', requireAuth, getMonthlyBusinessSummary);

module.exports = router;
