const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true }, // PAY-20260001
  paymentDate: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  paymentType: { 
    type: String, 
    enum: ['cash_sale', 'advance_payment', 'installment_payment'], 
    required: true 
  },
  referenceType: { 
    type: String, 
    enum: ['cashSale', 'installmentSale'], 
    required: true 
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  installmentScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentSchedule', default: null },
  amount: { type: Number, required: true, min: 0 },
  lateFeePaid: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash' },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
  notes: { type: String, default: "" }
}, { timestamps: true });

paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ paymentType: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
