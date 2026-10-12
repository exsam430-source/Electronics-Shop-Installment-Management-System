const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer
} = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getCustomers);
router.get('/:id', requireAuth, getCustomerById);
router.post('/', requireAuth, createCustomer);
router.put('/:id', requireAuth, updateCustomer);

module.exports = router;
