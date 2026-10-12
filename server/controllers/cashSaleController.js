const CashSale = require('../models/CashSale');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Customer = require('../models/Customer');
const ReferralPartner = require('../models/ReferralPartner');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Commission = require('../models/Commission');
const Warranty = require('../models/Warranty');
const BusinessProfile = require('../models/BusinessProfile');
const { generateCashSaleId, generatePaymentId, generateReceiptId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getCashSales = async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    let query = {};

    if (customerId) query.customerId = customerId;
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const sales = await CashSale.find(query)
      .populate('customerId', 'customerName mobileNumber customerId')
      .populate('referralPartnerId', 'partnerName partnerCode')
      .populate('receiptId', 'receiptNumber')
      .sort({ saleDate: -1 });

    return res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCashSaleById = async (req, res) => {
  try {
    const sale = await CashSale.findById(req.params.id)
      .populate('customerId', 'customerName mobileNumber customerId address')
      .populate('referralPartnerId', 'partnerName partnerCode commissionRate')
      .populate('receiptId');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Cash sale not found.' });
    }

    return res.json({ success: true, data: sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCashSale = async (req, res) => {
  try {
    const {
      customerId,
      referralPartnerId,
      items,
      paymentMethod = 'cash',
      amountReceived,
      notes = ""
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const profile = await BusinessProfile.findOne();
    const saleNumber = await generateCashSaleId();

    let totalAmount = 0;
    let totalPurchaseCost = 0;
    const processedItems = [];
    const warrantyItems = [];

    // Process each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found.` });
      }

      const qty = parseInt(item.quantity, 10) || 1;
      if (product.stockQuantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}`
        });
      }

      const unitPrice = Number(item.unitPrice) || product.cashSalePrice;
      const itemTotal = qty * unitPrice;
      const itemCost = qty * (product.purchasePrice || 0);

      totalAmount += itemTotal;
      totalPurchaseCost += itemCost;

      // Handle specific unit serial numbers
      let chosenSerial = item.serialNumber || "";
      if (chosenSerial) {
        const unit = await ProductUnit.findOne({
          productId: product._id,
          serialNumber: chosenSerial,
          status: 'available'
        });
        if (unit) {
          unit.status = 'sold';
          unit.saleType = 'cash';
          unit.customerId = customer._id;
          unit.soldDate = new Date();
          await unit.save();
        }
      } else {
        // Auto pick available unit if exists
        const unit = await ProductUnit.findOne({
          productId: product._id,
          status: 'available'
        });
        if (unit) {
          chosenSerial = unit.serialNumber;
          unit.status = 'sold';
          unit.saleType = 'cash';
          unit.customerId = customer._id;
          unit.soldDate = new Date();
          await unit.save();
        }
      }

      // Deduct stock quantity
      product.stockQuantity = Math.max(0, product.stockQuantity - qty);
      if (product.stockQuantity === 0) {
        product.productStatus = 'out_of_stock';
      }
      await product.save();

      processedItems.push({
        productId: product._id,
        productName: product.productName,
        brand: product.brand || "",
        modelNumber: product.modelNumber || "",
        serialNumber: chosenSerial,
        quantity: qty,
        unitPrice,
        totalPrice: itemTotal,
        purchasePrice: itemCost
      });

      if (product.warrantyDuration > 0 && chosenSerial) {
        warrantyItems.push({
          productId: product._id,
          serialNumber: chosenSerial,
          duration: product.warrantyDuration
        });
      }
    }

    const received = Number(amountReceived) !== undefined && !isNaN(Number(amountReceived)) ? Number(amountReceived) : totalAmount;
    const change = Math.max(0, received - totalAmount);
    const profit = totalAmount - totalPurchaseCost;

    const cashSale = await CashSale.create({
      saleNumber,
      saleDate: new Date(),
      customerId: customer._id,
      referralPartnerId: referralPartnerId || customer.referralPartnerId || null,
      items: processedItems,
      totalAmount,
      paymentMethod,
      amountReceived: received,
      changeReturned: change,
      purchasePrice: totalPurchaseCost,
      profit,
      notes
    });

    // 1. Generate Payment
    const paymentNumber = await generatePaymentId();
    const payment = await Payment.create({
      paymentNumber,
      paymentDate: new Date(),
      customerId: customer._id,
      paymentType: 'cash_sale',
      referenceType: 'cashSale',
      referenceId: cashSale._id,
      amount: totalAmount,
      paymentMethod,
      notes: `Cash sale ${saleNumber}`
    });

    // 2. Generate Receipt
    const receiptNumber = await generateReceiptId();
    const receipt = await Receipt.create({
      receiptNumber,
      receiptDate: new Date(),
      receiptType: 'cash_sale',
      customerId: customer._id,
      customerName: customer.customerName,
      customerMobile: customer.mobileNumber,
      referenceType: 'cashSale',
      referenceId: cashSale._id,
      paymentId: payment._id,
      items: processedItems,
      totalAmount,
      amountPaid: received,
      previouslyPaid: 0,
      remainingBalance: 0,
      changeReturned: change,
      paymentMethod,
      shopName: profile ? profile.shopName : "MR SOLVER Electronics",
      shopAddress: profile ? profile.address : "",
      shopPhone: profile ? (profile.phone || profile.mobile) : "",
      receiptHeader: profile ? profile.receiptHeader : "",
      receiptFooter: profile ? profile.receiptFooter : "",
      notes,
      isPrinted: false,
      printCount: 0
    });

    cashSale.receiptId = receipt._id;
    payment.receiptId = receipt._id;
    await cashSale.save();
    await payment.save();

    // 3. Update Customer Running Totals
    customer.totalPurchases += totalAmount;
    customer.totalPaid += totalAmount;
    await customer.save();

    // 4. Record Commission if referral partner is linked
    const partnerId = cashSale.referralPartnerId;
    if (partnerId) {
      const partner = await ReferralPartner.findById(partnerId);
      if (partner) {
        const commRate = partner.commissionRate || 1;
        const commAmount = (totalAmount * commRate) / 100;
        await Commission.create({
          referralPartnerId: partner._id,
          saleId: cashSale._id,
          saleNumber: cashSale.saleNumber,
          saleType: 'cash_sale',
          customerId: customer._id,
          customerName: customer.customerName,
          productDetails: processedItems.map(i => `${i.productName} (x${i.quantity})`).join(', '),
          sellingPrice: totalAmount,
          commissionRate: commRate,
          commissionAmount: commAmount,
          status: 'pending',
          amountPaid: 0,
          remainingAmount: commAmount,
          saleDate: new Date()
        });

        partner.totalCommissionEarned += commAmount;
        partner.commissionBalance = partner.totalCommissionEarned - partner.totalCommissionPaid;
        await partner.save();
      }
    }

    // 5. Create Warranties
    for (const w of warrantyItems) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + w.duration);
      await Warranty.create({
        productId: w.productId,
        customerId: customer._id,
        saleId: cashSale._id,
        serialNumber: w.serialNumber,
        warrantyDuration: w.duration,
        warrantyStartDate: new Date(),
        warrantyEndDate: endDate,
        warrantyStatus: 'active',
        claims: []
      });
    }

    await logActivity(req, 'create', 'sale', `Cash sale ${saleNumber} completed for Rs. ${totalAmount}`, cashSale._id);

    return res.status(201).json({
      success: true,
      data: cashSale,
      receipt,
      payment
    });
  } catch (error) {
    console.error('[Create Cash Sale Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCashSales,
  getCashSaleById,
  createCashSale
};
