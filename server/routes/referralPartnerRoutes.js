const express = require('express');
const router = express.Router();
const {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  payCommission
} = require('../controllers/referralPartnerController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getPartners);
router.get('/:id', requireAuth, getPartnerById);
router.post('/', requireAuth, createPartner);
router.put('/:id', requireAuth, updatePartner);
router.post('/:id/pay', requireAuth, payCommission);

module.exports = router;
