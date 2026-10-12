const InstallmentSale = require('../models/InstallmentSale');
const InstallmentSchedule = require('../models/InstallmentSchedule');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Customer = require('../models/Customer');
const ReferralPartner = require('../models/ReferralPartner');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Commission = require('../models/Commission');
const Warranty = require('../models/Warranty');
const BusinessProfile = require('../models/BusinessProfile');
const { generateInstallmentSaleId, generatePaymentId, generateReceiptId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getInstallmentSales = async (req, res) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;
    let query = {};

    if (status) query.accountStatus = status;
    if (customerId) query.customerId = customerId;
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const sales = await InstallmentSale.find(query)
      .populate('customerId', 'customerName mobileNumber customerId cnic address')
      .populate('referralPartnerId', 'partnerName partnerCode')
      .sort({ saleDate: -1 });

    return res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getInstallmentSaleById = async (req, res) => {
  try {
    const sale = await InstallmentSale.findById(req.params.id)
      .populate('customerId', 'customerName mobileNumber whatsappNumber customerId cnic address guarantorName guarantorMobile')
      .populate('referralPartnerId', 'partnerName partnerCode commissionRate');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Installment account not found.' });
    }

    const schedule = await InstallmentSchedule.find({ installmentSaleId: sale._id })
      .populate('paymentId')
      .populate('receiptId')
      .sort({ installmentNumber: 1 });

    const payments = await Payment.find({ referenceId: sale._id }).sort({ paymentDate: -1 });

    return res.json({
      success: true,
      data: sale,
      schedule,
      payments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createInstallmentSale = async (req, res) => {
  try {
    const {
      customerId,
      referralPartnerId,
      items,
      installmentDuration, // 3, 6, 9, 12
      advancePayment = 0,
      firstInstallmentCollected = false,
      firstDueDate,
      paymentMethod = 'cash',
      notes = ""
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and at least one product required.' });
    }

    const duration = parseInt(installmentDuration, 10);
    if (![3, 6, 9, 12].includes(duration)) {
      return res.status(400).json({ success: false, message: 'Duration must be 3, 6, 9, or 12 months.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const profile = await BusinessProfile.findOne();
    const saleNumber = await generateInstallmentSaleId();

    let totalSaleAmount = 0;
    let totalPurchaseCost = 0;
    const processedItems = [];
    const warrantyItems = [];

    // Process and validate all products & units
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

      const unitPrice = Number(item.unitPrice) || product.installmentSalePrice;
      const itemTotal = qty * unitPrice;
      const itemCost = qty * (product.purchasePrice || 0);

      totalSaleAmount += itemTotal;
      totalPurchaseCost += itemCost;

      // Handle unit serial numbers
      let chosenSerial = item.serialNumber || "";
      if (chosenSerial) {
        const unit = await ProductUnit.findOne({
          productId: product._id,
          serialNumber: chosenSerial,
          status: 'available'
        });
        if (unit) {
          unit.status = 'sold';
          unit.saleType = 'installment';
          unit.customerId = customer._id;
          unit.soldDate = new Date();
          await unit.save();
        }
      } else {
        const unit = await ProductUnit.findOne({
          productId: product._id,
          status: 'available'
        });
        if (unit) {
          chosenSerial = unit.serialNumber;
          unit.status = 'sold';
          unit.saleType = 'installment';
          unit.customerId = customer._id;
          unit.soldDate = new Date();
          await unit.save();
        }
      }

      product.stockQuantity = Math.max(0, product.stockQuantity - qty);
      if (product.stockQuantity === 0) product.productStatus = 'out_of_stock';
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

    const advance = Number(advancePayment) || 0;
    if (advance > totalSaleAmount) {
      return res.status(400).json({ success: false, message: 'Advance payment cannot exceed total sale price.' });
    }

    // Installment Calculation rules
    const netFinanced = totalSaleAmount - advance;
    const baseMonthlyAmount = Math.floor(netFinanced / duration);
    const roundingDiff = netFinanced - (baseMonthlyAmount * duration);

    let firstInstAmount = 0;
    let totalCollectedAtSale = advance;

    if (firstInstallmentCollected) {
      firstInstAmount = baseMonthlyAmount;
      totalCollectedAtSale = advance + firstInstAmount;
    }

    const remainingBalance = totalSaleAmount - totalCollectedAtSale;
    const profit = totalSaleAmount - totalPurchaseCost;

    const baseDueDate = firstDueDate ? new Date(firstDueDate) : new Date();
    if (!firstDueDate) {
      baseDueDate.setMonth(baseDueDate.getMonth() + 1);
    }

    const installmentSale = await InstallmentSale.create({
      saleNumber,
      saleDate: new Date(),
      customerId: customer._id,
      referralPartnerId: referralPartnerId || customer.referralPartnerId || null,
      items: processedItems,
      totalSaleAmount,
      totalPurchaseCost,
      advancePayment: advance,
      firstInstallmentCollected: !!firstInstallmentCollected,
      firstInstallmentAmount: firstInstAmount,
      totalCollectedAtSale,
      remainingBalance,
      installmentDuration: duration,
      numberOfInstallments: duration,
      monthlyInstallmentAmount: baseMonthlyAmount,
      firstDueDate: baseDueDate,
      accountStatus: remainingBalance === 0 ? 'completed' : 'active',
      totalAmountPaid: totalCollectedAtSale,
      totalRemainingBalance: remainingBalance,
      profit,
      notes
    });

    // Generate Payments & Receipts for Advance / First Installment
    let advanceReceipt = null;
    let firstInstReceipt = null;

    if (advance > 0) {
      const advPayNumber = await generatePaymentId();
      const advPayment = await Payment.create({
        paymentNumber: advPayNumber,
        paymentDate: new Date(),
        customerId: customer._id,
        paymentType: 'advance_payment',
        referenceType: 'installmentSale',
        referenceId: installmentSale._id,
        amount: advance,
        paymentMethod,
        notes: `Advance payment for installment sale ${saleNumber}`
      });

      const advReceiptNumber = await generateReceiptId();
      advanceReceipt = await Receipt.create({
        receiptNumber: advReceiptNumber,
        receiptDate: new Date(),
        receiptType: 'advance_payment',
        customerId: customer._id,
        customerName: customer.customerName,
        customerMobile: customer.mobileNumber,
        referenceType: 'installmentSale',
        referenceId: installmentSale._id,
        paymentId: advPayment._id,
        items: processedItems,
        totalAmount: totalSaleAmount,
        amountPaid: advance,
        previouslyPaid: 0,
        remainingBalance: totalSaleAmount - advance,
        paymentMethod,
        installmentInfo: {
          installmentNumber: 0,
          totalInstallments: duration,
          monthlyAmount: baseMonthlyAmount,
          nextDueDate: baseDueDate,
          nextAmountDue: baseMonthlyAmount
        },
        shopName: profile ? profile.shopName : "MR SOLVER Electronics",
        shopAddress: profile ? profile.address : "",
        shopPhone: profile ? (profile.phone || profile.mobile) : "",
        receiptHeader: profile ? profile.receiptHeader : "",
        receiptFooter: profile ? profile.receiptFooter : "",
        notes: "Advance Payment Received",
        isPrinted: false,
        printCount: 0
      });

      advPayment.receiptId = advanceReceipt._id;
      await advPayment.save();
      installmentSale.advanceReceiptId = advanceReceipt._id;
    }

    // Generate Installment Schedules (1 .. duration)
    const scheduleDocs = [];
    let firstInstallmentPaymentId = null;

    if (firstInstallmentCollected) {
      const firstPayNumber = await generatePaymentId();
      const firstPayment = await Payment.create({
        paymentNumber: firstPayNumber,
        paymentDate: new Date(),
        customerId: customer._id,
        paymentType: 'installment_payment',
        referenceType: 'installmentSale',
        referenceId: installmentSale._id,
        amount: firstInstAmount,
        paymentMethod,
        notes: `First installment collected at sale ${saleNumber}`
      });
      firstInstallmentPaymentId = firstPayment._id;

      const firstRecNumber = await generateReceiptId();
      firstInstReceipt = await Receipt.create({
        receiptNumber: firstRecNumber,
        receiptDate: new Date(),
        receiptType: 'installment_payment',
        customerId: customer._id,
        customerName: customer.customerName,
        customerMobile: customer.mobileNumber,
        referenceType: 'installmentSale',
        referenceId: installmentSale._id,
        paymentId: firstPayment._id,
        items: processedItems,
        totalAmount: totalSaleAmount,
        amountPaid: firstInstAmount,
        previouslyPaid: advance,
        remainingBalance,
        paymentMethod,
        installmentInfo: {
          installmentNumber: 1,
          totalInstallments: duration,
          monthlyAmount: baseMonthlyAmount,
          nextDueDate: new Date(baseDueDate),
          nextAmountDue: baseMonthlyAmount
        },
        shopName: profile ? profile.shopName : "MR SOLVER Electronics",
        shopAddress: profile ? profile.address : "",
        shopPhone: profile ? (profile.phone || profile.mobile) : "",
        receiptHeader: profile ? profile.receiptHeader : "",
        receiptFooter: profile ? profile.receiptFooter : "",
        notes: "First Installment Collected At Sale",
        isPrinted: false,
        printCount: 0
      });

      firstPayment.receiptId = firstInstReceipt._id;
      await firstPayment.save();
      installmentSale.firstInstallmentReceiptId = firstInstReceipt._id;
    }

    for (let i = 1; i <= duration; i++) {
      const isLast = (i === duration);
      const scheduledAmt = isLast ? (baseMonthlyAmount + roundingDiff) : baseMonthlyAmount;

      const dueDate = new Date(baseDueDate);
      // If first installment was collected at sale, installment #1 is dated today, and #2 starts at baseDueDate
      if (firstInstallmentCollected) {
        if (i === 1) {
          dueDate.setTime(new Date().getTime());
        } else {
          dueDate.setMonth(baseDueDate.getMonth() + (i - 2));
        }
      } else {
        dueDate.setMonth(baseDueDate.getMonth() + (i - 1));
      }

      const isFirstCollected = (firstInstallmentCollected && i === 1);

      scheduleDocs.push({
        installmentSaleId: installmentSale._id,
        customerId: customer._id,
        installmentNumber: i,
        dueDate,
        installmentAmount: scheduledAmt,
        amountPaid: isFirstCollected ? scheduledAmt : 0,
        remainingAmount: isFirstCollected ? 0 : scheduledAmt,
        paymentDate: isFirstCollected ? new Date() : null,
        paymentStatus: isFirstCollected ? 'paid' : 'pending',
        paymentId: isFirstCollected ? firstInstallmentPaymentId : null,
        receiptId: isFirstCollected && firstInstReceipt ? firstInstReceipt._id : null
      });
    }

    await InstallmentSchedule.insertMany(scheduleDocs);
    await installmentSale.save();

    // Update customer ledger
    customer.totalPurchases += totalSaleAmount;
    customer.totalPaid += totalCollectedAtSale;
    customer.outstandingBalance += remainingBalance;
    await customer.save();

    // Record Referral Commission on Total Installment Selling Price
    const partnerId = installmentSale.referralPartnerId;
    if (partnerId) {
      const partner = await ReferralPartner.findById(partnerId);
      if (partner) {
        const commRate = partner.commissionRate || 1;
        const commAmount = (totalSaleAmount * commRate) / 100;
        await Commission.create({
          referralPartnerId: partner._id,
          saleId: installmentSale._id,
          saleNumber: installmentSale.saleNumber,
          saleType: 'installment_sale',
          customerId: customer._id,
          customerName: customer.customerName,
          productDetails: processedItems.map(i => `${i.productName} (x${i.quantity})`).join(', '),
          sellingPrice: totalSaleAmount,
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

    // Create Warranties
    for (const w of warrantyItems) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + w.duration);
      await Warranty.create({
        productId: w.productId,
        customerId: customer._id,
        saleId: installmentSale._id,
        serialNumber: w.serialNumber,
        warrantyDuration: w.duration,
        warrantyStartDate: new Date(),
        warrantyEndDate: endDate,
        warrantyStatus: 'active',
        claims: []
      });
    }

    await logActivity(req, 'create', 'installment', `Created installment plan ${saleNumber} for ${customer.customerName} (Rs. ${totalSaleAmount}, ${duration} months)`, installmentSale._id);

    return res.status(201).json({
      success: true,
      data: installmentSale,
      advanceReceipt,
      firstInstReceipt
    });
  } catch (error) {
    console.error('[Create Installment Sale Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInstallmentSales,
  getInstallmentSaleById,
  createInstallmentSale
};
