const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true }, // e.g. SB-0001
  customerName: { type: String, required: true, trim: true },
  customerPhoto: { type: String, default: "" }, // Base64 data URL or photo path
  mobileNumber: { type: String, required: true, trim: true },
  whatsappNumber: { type: String, trim: true },
  cnic: { type: String, trim: true, default: "" }, // Optional CNIC for identity in installments
  address: { type: String, default: "" },
  guarantorName: { type: String, default: "" }, // Useful for installments
  guarantorMobile: { type: String, default: "" },
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', default: null },
  totalPurchases: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  registrationDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

customerSchema.index({ mobileNumber: 1 });
customerSchema.index({ referralPartnerId: 1 });

module.exports = mongoose.model('Customer', customerSchema);
