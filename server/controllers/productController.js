const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Category = require('../models/Category');
const { generateProductId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

// Get all products with search & filter
const getProducts = async (req, res) => {
  try {
    const { category, brand, status, search, lowStock } = req.query;
    let query = { isActive: true };

    if (category) query.categoryId = category;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (status) query.productStatus = status;
    if (search) {
      query.$or = [
        { productName: new RegExp(search, 'i') },
        { productCode: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { modelNumber: new RegExp(search, 'i') }
      ];
    }
    if (lowStock === 'true') {
      query.stockQuantity = { $lte: 2 };
    }

    const products = await Product.find(query)
      .populate('categoryId', 'categoryName')
      .populate('supplierId', 'supplierName')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product with serial numbers
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'categoryName')
      .populate('supplierId', 'supplierName');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const units = await ProductUnit.find({ productId: product._id }).sort({ createdAt: -1 });

    return res.json({ success: true, data: product, units });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add product
const createProduct = async (req, res) => {
  try {
    const {
      productName,
      categoryId,
      brand,
      modelNumber,
      description,
      purchasePrice,
      cashSalePrice,
      installmentSalePrice,
      initialStock = 0,
      serialNumbers = [],
      supplierId,
      warrantyDuration
    } = req.body;

    if (!productName || !categoryId || !brand || purchasePrice === undefined || cashSalePrice === undefined || installmentSalePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Required fields missing: Name, Category, Brand, Prices.' });
    }

    const productCode = await generateProductId();
    const stockQty = parseInt(initialStock, 10) || (serialNumbers.length > 0 ? serialNumbers.length : 0);

    const product = await Product.create({
      productCode,
      productName: productName.trim(),
      categoryId,
      brand: brand.trim(),
      modelNumber: modelNumber ? modelNumber.trim() : "",
      description: description || "",
      purchasePrice: Number(purchasePrice),
      cashSalePrice: Number(cashSalePrice),
      installmentSalePrice: Number(installmentSalePrice),
      stockQuantity: stockQty,
      supplierId: supplierId || null,
      warrantyDuration: Number(warrantyDuration) || 0,
      productStatus: stockQty > 0 ? 'available' : 'out_of_stock'
    });

    // Create serial number units if provided
    if (serialNumbers && serialNumbers.length > 0) {
      const unitDocs = serialNumbers.map(sn => ({
        productId: product._id,
        serialNumber: sn.trim(),
        status: 'available',
        notes: 'Initial stock intake'
      }));
      await ProductUnit.insertMany(unitDocs);
    } else if (stockQty > 0) {
      // Auto generate serial numbers if not explicitly provided
      const unitDocs = [];
      for (let i = 1; i <= stockQty; i++) {
        unitDocs.push({
          productId: product._id,
          serialNumber: `SN-${productCode}-${String(i).padStart(3, '0')}`,
          status: 'available',
          notes: 'Auto-generated unit'
        });
      }
      await ProductUnit.insertMany(unitDocs);
    }

    await logActivity(req, 'create', 'product', `Added product ${product.productName} (${productCode})`, product._id);

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const {
      productName,
      categoryId,
      brand,
      modelNumber,
      description,
      purchasePrice,
      cashSalePrice,
      installmentSalePrice,
      supplierId,
      warrantyDuration
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (productName) product.productName = productName.trim();
    if (categoryId) product.categoryId = categoryId;
    if (brand) product.brand = brand.trim();
    if (modelNumber !== undefined) product.modelNumber = modelNumber.trim();
    if (description !== undefined) product.description = description;
    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (cashSalePrice !== undefined) product.cashSalePrice = Number(cashSalePrice);
    if (installmentSalePrice !== undefined) product.installmentSalePrice = Number(installmentSalePrice);
    if (supplierId !== undefined) product.supplierId = supplierId || null;
    if (warrantyDuration !== undefined) product.warrantyDuration = Number(warrantyDuration);

    await product.save();
    await logActivity(req, 'update', 'product', `Updated product ${product.productName}`, product._id);

    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Adjust stock manually
const adjustStock = async (req, res) => {
  try {
    const { adjustmentQuantity, reason, serialNumbers = [] } = req.body;
    const qty = parseInt(adjustmentQuantity, 10);
    if (!qty || isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Valid adjustment quantity required.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const newStock = product.stockQuantity + qty;
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
    }

    product.stockQuantity = newStock;
    product.productStatus = newStock > 0 ? 'available' : 'out_of_stock';
    await product.save();

    if (qty > 0) {
      // Adding stock
      if (serialNumbers.length > 0) {
        const unitDocs = serialNumbers.map(sn => ({
          productId: product._id,
          serialNumber: sn.trim(),
          status: 'available',
          notes: `Stock adjustment: ${reason || 'Inward'}`
        }));
        await ProductUnit.insertMany(unitDocs);
      } else {
        const existingCount = await ProductUnit.countDocuments({ productId: product._id });
        const unitDocs = [];
        for (let i = 1; i <= qty; i++) {
          unitDocs.push({
            productId: product._id,
            serialNumber: `SN-${product.productCode}-${String(existingCount + i).padStart(3, '0')}`,
            status: 'available',
            notes: `Stock adjustment: ${reason || 'Inward'}`
          });
        }
        await ProductUnit.insertMany(unitDocs);
      }
    } else {
      // Reducing stock (mark units as damaged or removed)
      const unitsToRemove = await ProductUnit.find({ productId: product._id, status: 'available' })
        .limit(Math.abs(qty));
      for (const u of unitsToRemove) {
        u.status = 'damaged';
        u.notes = `Stock adjustment reduction: ${reason || 'Adjustment'}`;
        await u.save();
      }
    }

    await logActivity(req, 'update', 'product', `Stock adjusted by ${qty} for ${product.productName}. Reason: ${reason}`, product._id);

    return res.json({ success: true, data: product, message: 'Stock adjusted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get available units for a product (for selecting during cash/installment sales)
const getAvailableUnits = async (req, res) => {
  try {
    const units = await ProductUnit.find({
      productId: req.params.id,
      status: 'available'
    }).select('serialNumber status notes');

    return res.json({ success: true, data: units });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getAvailableUnits
};
