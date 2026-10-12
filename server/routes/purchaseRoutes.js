const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase
} = require('../controllers/purchaseController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getPurchases);
router.get('/:id', requireAuth, getPurchaseById);
router.post('/', requireAuth, createPurchase);

module.exports = router;
