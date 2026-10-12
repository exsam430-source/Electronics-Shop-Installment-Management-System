const Receipt = require('../models/Receipt');
const BusinessProfile = require('../models/BusinessProfile');
const { logActivity } = require('../middleware/activityLogger');

const getReceipts = async (req, res) => {
  try {
    const { search, receiptType, startDate, endDate } = req.query;
    let query = {};

    if (receiptType) query.receiptType = receiptType;
    if (search) {
      query.$or = [
        { receiptNumber: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
        { customerMobile: new RegExp(search, 'i') }
      ];
    }
    if (startDate && endDate) {
      query.receiptDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    }

    const receipts = await Receipt.find(query)
      .populate('customerId', 'customerName mobileNumber customerId')
      .sort({ receiptDate: -1 });

    return res.json({ success: true, count: receipts.length, data: receipts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('customerId', 'customerName mobileNumber customerId cnic address');

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    // Always fetch latest business profile details
    const profile = await BusinessProfile.findOne();

    return res.json({
      success: true,
      data: receipt,
      profile: profile || {}
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const recordReceiptPrint = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    receipt.isPrinted = true;
    receipt.printCount += 1;
    await receipt.save();

    await logActivity(req, 'print', 'receipt', `Printed receipt ${receipt.receiptNumber} (Count: ${receipt.printCount})`, receipt._id);

    return res.json({
      success: true,
      data: receipt,
      isDuplicate: receipt.printCount > 1
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReceipts,
  getReceiptById,
  recordReceiptPrint
};
