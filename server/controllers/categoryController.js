const Category = require('../models/Category');
const Product = require('../models/Product');
const { logActivity } = require('../middleware/activityLogger');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, categoryName: 1 });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    if (!categoryName) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await Category.findOne({ categoryName: new RegExp(`^${categoryName.trim()}$`, 'i') });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const count = await Category.countDocuments();
    const category = await Category.create({
      categoryName: categoryName.trim(),
      description: description || "",
      isActive: true,
      isDefault: false,
      sortOrder: count + 1
    });

    await logActivity(req, 'create', 'category', `Added category ${category.categoryName}`, category._id);

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryName, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (categoryName) category.categoryName = categoryName.trim();
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    await logActivity(req, 'update', 'category', `Updated category ${category.categoryName}`, category._id);

    return res.json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory
};
