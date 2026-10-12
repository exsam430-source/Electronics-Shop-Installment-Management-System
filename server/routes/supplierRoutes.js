const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  paySupplier
} = require('../controllers/supplierController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getSuppliers);
router.get('/:id', requireAuth, getSupplierById);
router.post('/', requireAuth, createSupplier);
router.put('/:id', requireAuth, updateSupplier);
router.post('/:id/pay', requireAuth, paySupplier);

module.exports = router;
