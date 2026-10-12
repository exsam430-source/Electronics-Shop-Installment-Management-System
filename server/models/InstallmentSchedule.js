const mongoose = require('mongoose');

const installmentScheduleSchema = new mongoose.Schema({
  installmentSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentSale', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  installmentNumber: { type: Number, required: true }, // 1, 2, ... N
  dueDate: { type: Date, required: true },
  installmentAmount: { type: Number, required: true }, // Scheduled monthly amount
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true }, // installmentAmount - amountPaid
  lateFeeApplied: { type: Boolean, default: false },
  lateFeeAmount: { type: Number, default: 0 },
  lateFeePaid: { type: Number, default: 0 },
  paymentDate: { type: Date, default: null },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partial', 'overdue'], 
    default: 'pending' 
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
  notes: { type: String, default: "" }
}, { timestamps: true });

installmentScheduleSchema.index({ installmentSaleId: 1, installmentNumber: 1 });
installmentScheduleSchema.index({ customerId: 1 });
installmentScheduleSchema.index({ dueDate: 1, paymentStatus: 1 });

module.exports = mongoose.model('InstallmentSchedule', installmentScheduleSchema);
