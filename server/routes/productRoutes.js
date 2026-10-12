const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getAvailableUnits
} = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getProducts);
router.get('/:id', requireAuth, getProductById);
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.post('/:id/adjust-stock', requireAuth, adjustStock);
router.get('/:id/available-units', requireAuth, getAvailableUnits);

module.exports = router;
