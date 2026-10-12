const Payment = require('../models/Payment');

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

module.exports = {
  getPayments,
  getTodayCollections
};
