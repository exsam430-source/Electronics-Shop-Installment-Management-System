const mongoose = require('mongoose');

const commissionPaymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true }, // CPAY-20260001
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', required: true },
  paymentDate: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, default: 'cash' },
  commissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commission' }],
  notes: { type: String, default: "" }
}, { timestamps: true });

commissionPaymentSchema.index({ referralPartnerId: 1 });
commissionPaymentSchema.index({ paymentDate: 1 });

module.exports = mongoose.model('CommissionPayment', commissionPaymentSchema);
