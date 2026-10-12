const express = require('express');
const router = express.Router();
const {
  getReturns,
  createReturn,
  getWarranties,
  addWarrantyClaim
} = require('../controllers/returnController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getReturns);
router.post('/', requireAuth, createReturn);
router.get('/warranties', requireAuth, getWarranties);
router.post('/warranties/:id/claims', requireAuth, addWarrantyClaim);

module.exports = router;
