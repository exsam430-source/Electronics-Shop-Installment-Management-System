const mongoose = require('mongoose');

const referralPartnerSchema = new mongoose.Schema({
  partnerCode: { type: String, required: true, unique: true }, // e.g. REF-001
  partnerName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  whatsappNumber: { type: String, trim: true },
  commissionRate: { type: Number, default: 1 }, // Default 1%
  totalCommissionEarned: { type: Number, default: 0 },
  totalCommissionPaid: { type: Number, default: 0 },
  commissionBalance: { type: Number, default: 0 }, // Earned - Paid
  notes: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ReferralPartner', referralPartnerSchema);
