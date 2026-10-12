const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Supplier = require('../models/Supplier');
const { generatePurchaseId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getPurchases = async (req, res) => {
  try {
    const { supplierId, startDate, endDate } = req.query;
    let query = {};

    if (supplierId) query.supplierId = supplierId;
    if (startDate && endDate) {
      query.purchaseDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const purchases = await Purchase.find(query)
      .populate('supplierId', 'supplierName phone supplierCode')
      .sort({ purchaseDate: -1 });

    return res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId', 'supplierName phone supplierCode address');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found.' });
    }

    return res.json({ success: true, data: purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      purchaseDate,
      items,
      amountPaid = 0,
      paymentMethod = 'cash',
      notes = ""
    } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and at least one item required.' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const purchaseNumber = await generatePurchaseId();
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ID ${item.productId} not found.` });
      }

      const qty = parseInt(item.quantity, 10);
      const unitPrice = Number(item.unitPrice);
      const itemTotal = qty * unitPrice;
      totalAmount += itemTotal;

      const serials = Array.isArray(item.serialNumbers) ? item.serialNumbers.map(s => s.trim()).filter(Boolean) : [];

      processedItems.push({
        productId: product._id,
        productName: product.productName,
        quantity: qty,
        unitPrice,
        totalPrice: itemTotal,
        serialNumbers: serials
      });
    }

    const paid = Number(amountPaid) || 0;
    const balanceRemaining = Math.max(0, totalAmount - paid);

    const purchase = await Purchase.create({
      purchaseNumber,
      supplierId,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      items: processedItems,
      totalAmount,
      amountPaid: paid,
      balanceRemaining,
      paymentMethod,
      notes
    });

    // Update product stock and units
    for (const item of processedItems) {
      const product = await Product.findById(item.productId);
      product.stockQuantity += item.quantity;
      product.purchasePrice = item.unitPrice; // update latest purchase cost
      product.productStatus = 'available';
      await product.save();

      // Create product units with serial numbers
      if (item.serialNumbers.length > 0) {
        const unitDocs = item.serialNumbers.map(sn => ({
          productId: product._id,
          serialNumber: sn,
          status: 'available',
          purchaseId: purchase._id,
          notes: `Purchase ${purchaseNumber}`
        }));
        await ProductUnit.insertMany(unitDocs);
      } else {
        // Auto-generate serial numbers for units
        const existingCount = await ProductUnit.countDocuments({ productId: product._id });
        const unitDocs = [];
        for (let i = 1; i <= item.quantity; i++) {
          unitDocs.push({
            productId: product._id,
            serialNumber: `SN-${product.productCode}-${String(existingCount + i).padStart(3, '0')}`,
            status: 'available',
            purchaseId: purchase._id,
            notes: `Purchase ${purchaseNumber}`
          });
        }
        await ProductUnit.insertMany(unitDocs);
      }
    }

    // Update supplier balance
    supplier.balance += balanceRemaining;
    await supplier.save();

    await logActivity(req, 'create', 'purchase', `Recorded purchase ${purchaseNumber} from ${supplier.supplierName} total Rs. ${totalAmount}`, purchase._id);

    return res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    console.error('[Create Purchase Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase
};
