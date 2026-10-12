const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory
} = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getCategories);
router.post('/', requireAuth, createCategory);
router.put('/:id', requireAuth, updateCategory);

module.exports = router;
