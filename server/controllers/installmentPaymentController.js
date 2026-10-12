const InstallmentSale = require('../models/InstallmentSale');
const InstallmentSchedule = require('../models/InstallmentSchedule');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const BusinessProfile = require('../models/BusinessProfile');
const { generatePaymentId, generateReceiptId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

// Get active / overdue / completed accounts
const getInstallmentAccounts = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) query.accountStatus = status;

    let accounts = await InstallmentSale.find(query)
      .populate('customerId', 'customerName mobileNumber customerId cnic address')
      .populate('referralPartnerId', 'partnerName')
      .sort({ createdAt: -1 });

    if (search) {
      accounts = accounts.filter(acc => {
        const cName = acc.customerId ? acc.customerId.customerName : '';
        const cId = acc.customerId ? acc.customerId.customerId : '';
        const cMobile = acc.customerId ? acc.customerId.mobileNumber : '';
        return (
          acc.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
          cName.toLowerCase().includes(search.toLowerCase()) ||
          cId.toLowerCase().includes(search.toLowerCase()) ||
          cMobile.includes(search)
        );
      });
    }

    return res.json({ success: true, count: accounts.length, data: accounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Record Installment Payment
const recordInstallmentPayment = async (req, res) => {
  try {
    const {
      installmentSaleId,
      scheduleId,
      amount,
      paymentMethod = 'cash',
      applyLateFee = false,
      notes = ""
    } = req.body;

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required.' });
    }

    const sale = await InstallmentSale.findById(installmentSaleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Installment account not found.' });
    }

    const customer = await Customer.findById(sale.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const profile = await BusinessProfile.findOne();

    // Check schedules
    const unpaidSchedules = await InstallmentSchedule.find({
      installmentSaleId: sale._id,
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
    }).sort({ installmentNumber: 1 });

    if (unpaidSchedules.length === 0) {
      return res.status(400).json({ success: false, message: 'All installments for this account are already paid!' });
    }

    // Determine target schedule (specific or first unpaid)
    let primarySchedule = null;
    if (scheduleId) {
      primarySchedule = unpaidSchedules.find(s => s._id.toString() === scheduleId) || unpaidSchedules[0];
    } else {
      primarySchedule = unpaidSchedules[0];
    }

    // Calculate late fee if enabled
    let calculatedLateFee = 0;
    if (applyLateFee && profile && profile.lateFeeSettings && profile.lateFeeSettings.enabled) {
      const now = new Date();
      const dueDate = new Date(primarySchedule.dueDate);
      const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      if (diffDays > (profile.lateFeeSettings.graceDays || 0)) {
        if (profile.lateFeeSettings.type === 'percentage') {
          calculatedLateFee = (primarySchedule.installmentAmount * (profile.lateFeeSettings.percentage || 2)) / 100;
        } else {
          calculatedLateFee = profile.lateFeeSettings.amount || 500;
        }
      }
    }

    const paymentNumber = await generatePaymentId();
    const payment = await Payment.create({
      paymentNumber,
      paymentDate: new Date(),
      customerId: customer._id,
      paymentType: 'installment_payment',
      referenceType: 'installmentSale',
      referenceId: sale._id,
      installmentScheduleId: primarySchedule._id,
      amount: payAmt,
      lateFeePaid: calculatedLateFee,
      paymentMethod,
      notes: notes || `Installment #${primarySchedule.installmentNumber} payment for ${sale.saleNumber}`
    });

    // Apply amount across unpaid schedules starting from primarySchedule
    let fundsRemaining = payAmt;
    const startIndex = unpaidSchedules.findIndex(s => s._id.toString() === primarySchedule._id.toString());
    const orderedSchedules = startIndex >= 0 ? unpaidSchedules.slice(startIndex) : unpaidSchedules;

    let lastUpdatedSchedule = primarySchedule;

    for (const sched of orderedSchedules) {
      if (fundsRemaining <= 0) break;

      const owedOnThis = sched.remainingAmount;
      if (fundsRemaining >= owedOnThis) {
        sched.amountPaid += owedOnThis;
        sched.remainingAmount = 0;
        sched.paymentStatus = 'paid';
        sched.paymentDate = new Date();
        sched.paymentId = payment._id;
        fundsRemaining -= owedOnThis;
      } else {
        sched.amountPaid += fundsRemaining;
        sched.remainingAmount -= fundsRemaining;
        sched.paymentStatus = 'partial';
        sched.paymentDate = new Date();
        sched.paymentId = payment._id;
        fundsRemaining = 0;
      }

      if (calculatedLateFee > 0 && sched._id.toString() === primarySchedule._id.toString()) {
        sched.lateFeeApplied = true;
        sched.lateFeeAmount = calculatedLateFee;
        sched.lateFeePaid = calculatedLateFee;
      }

      await sched.save();
      lastUpdatedSchedule = sched;
    }

    // Update InstallmentSale balance and status
    const previousPaid = sale.totalAmountPaid;
    sale.totalAmountPaid += payAmt;
    sale.totalRemainingBalance = Math.max(0, sale.totalRemainingBalance - payAmt);

    // Check if fully paid
    const remainingUnpaidCount = await InstallmentSchedule.countDocuments({
      installmentSaleId: sale._id,
      paymentStatus: { $ne: 'paid' }
    });

    if (remainingUnpaidCount === 0 || sale.totalRemainingBalance === 0) {
      sale.accountStatus = 'completed';
    } else {
      // Check if overdue
      const hasOverdue = await InstallmentSchedule.exists({
        installmentSaleId: sale._id,
        dueDate: { $lt: new Date() },
        paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
      });
      sale.accountStatus = hasOverdue ? 'overdue' : 'active';
    }
    await sale.save();

    // Update customer balances
    customer.totalPaid += payAmt;
    customer.outstandingBalance = Math.max(0, customer.outstandingBalance - payAmt);
    await customer.save();

    // Find next due schedule for receipt info
    const nextUnpaid = await InstallmentSchedule.findOne({
      installmentSaleId: sale._id,
      paymentStatus: { $ne: 'paid' }
    }).sort({ installmentNumber: 1 });

    // Generate Receipt
    const receiptNumber = await generateReceiptId();
    const receipt = await Receipt.create({
      receiptNumber,
      receiptDate: new Date(),
      receiptType: 'installment_payment',
      customerId: customer._id,
      customerName: customer.customerName,
      customerMobile: customer.mobileNumber,
      referenceType: 'installmentSale',
      referenceId: sale._id,
      paymentId: payment._id,
      items: sale.items,
      totalAmount: sale.totalSaleAmount,
      amountPaid: payAmt,
      previouslyPaid: previousPaid,
      remainingBalance: sale.totalRemainingBalance,
      lateFeePaid: calculatedLateFee,
      paymentMethod,
      installmentInfo: {
        installmentNumber: primarySchedule.installmentNumber,
        totalInstallments: sale.numberOfInstallments,
        monthlyAmount: sale.monthlyInstallmentAmount,
        nextDueDate: nextUnpaid ? nextUnpaid.dueDate : null,
        nextAmountDue: nextUnpaid ? nextUnpaid.remainingAmount : 0
      },
      shopName: profile ? profile.shopName : "MR SOLVER Electronics",
      shopAddress: profile ? profile.address : "",
      shopPhone: profile ? (profile.phone || profile.mobile) : "",
      receiptHeader: profile ? profile.receiptHeader : "",
      receiptFooter: profile ? profile.receiptFooter : "",
      notes: notes || `Installment #${primarySchedule.installmentNumber}`,
      isPrinted: false,
      printCount: 0
    });

    payment.receiptId = receipt._id;
    await payment.save();

    await logActivity(req, 'create', 'payment', `Recorded installment payment of Rs. ${payAmt} for ${customer.customerName} (${sale.saleNumber})`, payment._id);

    return res.status(201).json({
      success: true,
      message: 'Installment payment recorded successfully.',
      payment,
      receipt,
      sale,
      completed: sale.accountStatus === 'completed'
    });
  } catch (error) {
    console.error('[Record Payment Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Overdue Installments list
const getOverdueInstallments = async (req, res) => {
  try {
    const now = new Date();
    const overdueSchedules = await InstallmentSchedule.find({
      dueDate: { $lt: now },
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
    })
      .populate('installmentSaleId')
      .populate('customerId', 'customerName mobileNumber whatsappNumber customerId')
      .sort({ dueDate: 1 });

    const formatted = overdueSchedules.map(s => {
      const daysOverdue = Math.floor((now - new Date(s.dueDate)) / (1000 * 60 * 60 * 24));
      return {
        scheduleId: s._id,
        installmentNumber: s.installmentNumber,
        dueDate: s.dueDate,
        daysOverdue,
        installmentAmount: s.installmentAmount,
        amountPaid: s.amountPaid,
        remainingAmount: s.remainingAmount,
        customer: s.customerId,
        sale: s.installmentSaleId
      };
    });

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInstallmentAccounts,
  recordInstallmentPayment,
  getOverdueInstallments
};
