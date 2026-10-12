const Return = require('../models/Return');
const CashSale = require('../models/CashSale');
const InstallmentSale = require('../models/InstallmentSale');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Customer = require('../models/Customer');
const Warranty = require('../models/Warranty');
const { generateReturnId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate('customerId', 'customerName mobileNumber customerId')
      .populate('items.productId', 'productName productCode')
      .sort({ returnDate: -1 });

    return res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createReturn = async (req, res) => {
  try {
    const {
      customerId,
      saleId,
      saleType, // cash_sale or installment_sale
      returnType = 'return', // return, exchange, damaged, warranty
      items, // [{ productId, productName, serialNumber, quantity, returnReason }]
      refundAmount = 0,
      exchangeProductId = null,
      exchangeSerialNumber = "",
      installmentAdjustment = 0,
      notes = ""
    } = req.body;

    if (!customerId || !saleId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer, sale ID and return items required.' });
    }

    const returnNumber = await generateReturnId();
    let saleNumber = "";

    if (saleType === 'cash_sale') {
      const cSale = await CashSale.findById(saleId);
      if (cSale) saleNumber = cSale.saleNumber;
    } else {
      const iSale = await InstallmentSale.findById(saleId);
      if (iSale) {
        saleNumber = iSale.saleNumber;
        // Adjust installment account balance if specified
        if (installmentAdjustment > 0) {
          iSale.totalRemainingBalance = Math.max(0, iSale.totalRemainingBalance - Number(installmentAdjustment));
          iSale.totalSaleAmount = Math.max(0, iSale.totalSaleAmount - Number(installmentAdjustment));
          await iSale.save();
        }
      }
    }

    // Process stock restoration for returned items
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const qty = Number(item.quantity) || 1;
        product.stockQuantity += qty;
        product.productStatus = 'available';
        await product.save();

        if (item.serialNumber) {
          const unit = await ProductUnit.findOne({
            productId: product._id,
            serialNumber: item.serialNumber
          });
          if (unit) {
            unit.status = returnType === 'damaged' ? 'damaged' : 'available';
            unit.notes = `Returned via ${returnNumber}: ${item.returnReason || ''}`;
            await unit.save();
          }
        }
      }
    }

    // If exchange product is chosen, deduct its stock
    if (exchangeProductId) {
      const exProduct = await Product.findById(exchangeProductId);
      if (exProduct && exProduct.stockQuantity > 0) {
        exProduct.stockQuantity -= 1;
        if (exProduct.stockQuantity === 0) exProduct.productStatus = 'out_of_stock';
        await exProduct.save();

        if (exchangeSerialNumber) {
          const exUnit = await ProductUnit.findOne({
            productId: exProduct._id,
            serialNumber: exchangeSerialNumber,
            status: 'available'
          });
          if (exUnit) {
            exUnit.status = 'sold';
            exUnit.notes = `Exchange unit for return ${returnNumber}`;
            await exUnit.save();
          }
        }
      }
    }

    const returnRecord = await Return.create({
      returnNumber,
      returnDate: new Date(),
      customerId,
      saleId,
      saleNumber,
      saleType,
      returnType,
      items,
      refundAmount: Number(refundAmount) || 0,
      exchangeProductId: exchangeProductId || null,
      exchangeSerialNumber: exchangeSerialNumber || "",
      installmentAdjustment: Number(installmentAdjustment) || 0,
      stockAdjusted: true,
      notes
    });

    await logActivity(req, 'create', 'return', `Processed ${returnType} ${returnNumber} for sale ${saleNumber}`, returnRecord._id);

    return res.status(201).json({
      success: true,
      message: 'Return recorded successfully.',
      data: returnRecord
    });
  } catch (error) {
    console.error('[Return Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Warranty queries & claims
const getWarranties = async (req, res) => {
  try {
    const { serialNumber, customerId, status } = req.query;
    let query = {};

    if (serialNumber) query.serialNumber = new RegExp(serialNumber, 'i');
    if (customerId) query.customerId = customerId;
    if (status) query.warrantyStatus = status;

    const warranties = await Warranty.find(query)
      .populate('productId', 'productName brand modelNumber productCode')
      .populate('customerId', 'customerName mobileNumber customerId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: warranties.length, data: warranties });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addWarrantyClaim = async (req, res) => {
  try {
    const { issue, resolution, status = 'pending' } = req.body;
    if (!issue) {
      return res.status(400).json({ success: false, message: 'Issue description is required.' });
    }

    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    warranty.claims.push({
      claimDate: new Date(),
      issue: issue.trim(),
      resolution: resolution || "",
      status
    });

    if (status === 'resolved') {
      warranty.warrantyStatus = 'claimed';
    }

    await warranty.save();
    await logActivity(req, 'update', 'warranty', `Logged warranty claim for serial ${warranty.serialNumber}`, warranty._id);

    return res.json({ success: true, data: warranty, message: 'Warranty claim logged.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReturns,
  createReturn,
  getWarranties,
  addWarrantyClaim
};
