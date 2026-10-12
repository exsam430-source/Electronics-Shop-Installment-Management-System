const ReferralPartner = require('../models/ReferralPartner');
const Commission = require('../models/Commission');
const CommissionPayment = require('../models/CommissionPayment');
const { generatePartnerId, generateCommissionPaymentId } = require('../utils/idGenerator');
const { logActivity } = require('../middleware/activityLogger');

const getPartners = async (req, res) => {
  try {
    const partners = await ReferralPartner.find({ isActive: true }).sort({ partnerName: 1 });
    return res.json({ success: true, count: partners.length, data: partners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPartnerById = async (req, res) => {
  try {
    const partner = await ReferralPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner not found.' });
    }

    const commissions = await Commission.find({ referralPartnerId: partner._id }).sort({ saleDate: -1 });
    const payments = await CommissionPayment.find({ referralPartnerId: partner._id }).sort({ paymentDate: -1 });

    return res.json({
      success: true,
      data: partner,
      commissions,
      payments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPartner = async (req, res) => {
  try {
    const { partnerName, mobileNumber, whatsappNumber, commissionRate = 1, notes = "" } = req.body;
    if (!partnerName || !mobileNumber) {
      return res.status(400).json({ success: false, message: 'Partner name and mobile number are required.' });
    }

    const partnerCode = await generatePartnerId();
    const finalWhatsApp = whatsappNumber && whatsappNumber.trim() ? whatsappNumber.trim() : mobileNumber.trim();

    const partner = await ReferralPartner.create({
      partnerCode,
      partnerName: partnerName.trim(),
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: finalWhatsApp,
      commissionRate: Number(commissionRate) || 1,
      notes
    });

    await logActivity(req, 'create', 'partner', `Created referral partner ${partner.partnerName} (${partnerCode})`, partner._id);

    return res.status(201).json({ success: true, data: partner });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePartner = async (req, res) => {
  try {
    const { partnerName, mobileNumber, whatsappNumber, commissionRate, notes } = req.body;
    const partner = await ReferralPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    if (partnerName) partner.partnerName = partnerName.trim();
    if (mobileNumber) partner.mobileNumber = mobileNumber.trim();
    if (whatsappNumber !== undefined) partner.whatsappNumber = whatsappNumber.trim();
    if (commissionRate !== undefined) partner.commissionRate = Number(commissionRate);
    if (notes !== undefined) partner.notes = notes;

    await partner.save();
    await logActivity(req, 'update', 'partner', `Updated referral partner ${partner.partnerName}`, partner._id);

    return res.json({ success: true, data: partner });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Record commission payment to referral partner
const payCommission = async (req, res) => {
  try {
    const { amount, paymentMethod = 'cash', notes = "" } = req.body;
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required.' });
    }

    const partner = await ReferralPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    const paymentNumber = await generateCommissionPaymentId();

    // Settle pending commission records
    let remainingToSettle = payAmt;
    const pendingCommissions = await Commission.find({
      referralPartnerId: partner._id,
      status: { $in: ['pending', 'partial'] }
    }).sort({ saleDate: 1 });

    const settledIds = [];
    for (const comm of pendingCommissions) {
      if (remainingToSettle <= 0) break;

      if (remainingToSettle >= comm.remainingAmount) {
        remainingToSettle -= comm.remainingAmount;
        comm.amountPaid += comm.remainingAmount;
        comm.remainingAmount = 0;
        comm.status = 'paid';
      } else {
        comm.amountPaid += remainingToSettle;
        comm.remainingAmount -= remainingToSettle;
        comm.status = 'partial';
        remainingToSettle = 0;
      }
      await comm.save();
      settledIds.push(comm._id);
    }

    const paymentRecord = await CommissionPayment.create({
      paymentNumber,
      referralPartnerId: partner._id,
      paymentDate: new Date(),
      amount: payAmt,
      paymentMethod,
      commissionIds: settledIds,
      notes
    });

    // Update partner balances
    partner.totalCommissionPaid += payAmt;
    partner.commissionBalance = Math.max(0, partner.totalCommissionEarned - partner.totalCommissionPaid);
    await partner.save();

    await logActivity(req, 'create', 'commission', `Paid Rs. ${payAmt} commission to ${partner.partnerName} (${paymentNumber})`, paymentRecord._id);

    return res.status(201).json({
      success: true,
      data: paymentRecord,
      partner,
      message: `Commission payment of Rs. ${payAmt} recorded successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  payCommission
};
