const Payment = require('../models/Payment');
const InstallmentSale = require('../models/InstallmentSale');
const InstallmentSchedule = require('../models/InstallmentSchedule');
const Customer = require('../models/Customer');
const Receipt = require('../models/Receipt');
const { logActivity } = require('../middleware/activityLogger');

const getPayments = async (req, res) => {
  try {
    const { paymentType, customerId, startDate, endDate, paymentMethod } = req.query;
    let query = {};

    if (paymentType) query.paymentType = paymentType;
    if (customerId) query.customerId = customerId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const payments = await Payment.find(query)
      .populate('customerId', 'customerName mobileNumber customerId')
      .populate('receiptId', 'receiptNumber')
      .sort({ paymentDate: -1 });

    const totalAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return res.json({
      success: true,
      count: payments.length,
      totalAmount,
      data: payments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTodayCollections = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const payments = await Payment.find({
      paymentDate: { $gte: todayStart, $lte: todayEnd }
    })
      .populate('customerId', 'customerName mobileNumber customerId')
      .populate('receiptId', 'receiptNumber')
      .sort({ paymentDate: -1 });

    const totalToday = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Grouping by method
    const byMethod = {};
    const byType = {};

    payments.forEach(p => {
      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount;
      byType[p.paymentType] = (byType[p.paymentType] || 0) + p.amount;
    });

    return res.json({
      success: true,
      totalToday,
      count: payments.length,
      byMethod,
      byType,
      data: payments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payAmt = Number(payment.amount) || 0;

    // Handle installment payment reversal
    if (payment.paymentType === 'installment_payment') {
      const sale = await InstallmentSale.findById(payment.referenceId);
      const customer = await Customer.findById(payment.customerId);

      // Revert schedules linked to this payment
      const schedules = await InstallmentSchedule.find({
        installmentSaleId: payment.referenceId,
        paymentId: payment._id
      }).sort({ installmentNumber: -1 });

      let rollbackRemaining = payAmt;

      for (const sched of schedules) {
        if (rollbackRemaining <= 0) break;

        const paidOnThis = Math.min(sched.amountPaid, rollbackRemaining);
        sched.amountPaid = Math.max(0, sched.amountPaid - paidOnThis);
        sched.remainingAmount = Math.max(0, sched.installmentAmount - sched.amountPaid);

        if (sched.remainingAmount > 0) {
          const isOverdue = new Date(sched.dueDate) < new Date();
          sched.paymentStatus = sched.amountPaid > 0 ? 'partial' : (isOverdue ? 'overdue' : 'pending');
          sched.paymentId = null;
          sched.paymentDate = null;
          sched.receiptId = null;
        }

        if (payment.lateFeePaid > 0 && sched.lateFeeApplied) {
          sched.lateFeeApplied = false;
          sched.lateFeeAmount = 0;
          sched.lateFeePaid = 0;
        }

        await sched.save();
        rollbackRemaining -= paidOnThis;
      }

      // Revert InstallmentSale balances
      if (sale) {
        sale.totalAmountPaid = Math.max(0, (sale.totalAmountPaid || 0) - payAmt);
        sale.totalRemainingBalance = Math.min(sale.totalSaleAmount, (sale.totalRemainingBalance || 0) + payAmt);
        sale.remainingBalance = sale.totalRemainingBalance;

        // Recalculate account status
        const hasOverdue = await InstallmentSchedule.exists({
          installmentSaleId: sale._id,
          dueDate: { $lt: new Date() },
          paymentStatus: { $in: ['pending', 'partial', 'overdue'] }
        });

        sale.accountStatus = hasOverdue ? 'overdue' : 'active';
        await sale.save();
      }

      // Revert customer balances
      if (customer) {
        customer.totalPaid = Math.max(0, (customer.totalPaid || 0) - payAmt);
        customer.outstandingBalance = (customer.outstandingBalance || 0) + payAmt;
        await customer.save();
      }
    } else if (payment.paymentType === 'advance_payment') {
      // Revert advance payment
      const sale = await InstallmentSale.findById(payment.referenceId);
      const customer = await Customer.findById(payment.customerId);

      if (sale) {
        sale.advancePayment = Math.max(0, (sale.advancePayment || 0) - payAmt);
        sale.totalAmountPaid = Math.max(0, (sale.totalAmountPaid || 0) - payAmt);
        sale.totalRemainingBalance = Math.min(sale.totalSaleAmount, (sale.totalRemainingBalance || 0) + payAmt);
        sale.accountStatus = 'active';
        await sale.save();
      }

      if (customer) {
        customer.totalPaid = Math.max(0, (customer.totalPaid || 0) - payAmt);
        customer.outstandingBalance = (customer.outstandingBalance || 0) + payAmt;
        await customer.save();
      }
    }

    // Delete associated receipts
    await Receipt.deleteMany({ paymentId: payment._id });

    // Delete payment
    await Payment.findByIdAndDelete(payment._id);

    await logActivity(
      req,
      'delete',
      'payment',
      `Cancelled payment ${payment.paymentNumber} of Rs. ${payAmt}`,
      payment.referenceId || payment._id
    );

    return res.json({
      success: true,
      message: `Payment ${payment.paymentNumber} of Rs. ${payAmt.toLocaleString()} successfully cancelled and balance restored.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPayments,
  getTodayCollections,
  cancelPayment
};
