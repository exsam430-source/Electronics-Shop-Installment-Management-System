const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  brand: { type: String, default: "" },
  modelNumber: { type: String, default: "" },
  serialNumber: { type: String, default: "" },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true }, // REC-000001
  receiptDate: { type: Date, default: Date.now },
  receiptType: { 
    type: String, 
    enum: ['cash_sale', 'advance_payment', 'installment_payment'], 
    required: true 
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerMobile: { type: String, default: "" },
  referenceType: { type: String, enum: ['cashSale', 'installmentSale'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  items: [receiptItemSchema],
  totalAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, required: true },
  previouslyPaid: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  lateFeePaid: { type: Number, default: 0 },
  changeReturned: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'Cash' },
  installmentInfo: {
    installmentNumber: { type: Number },
    totalInstallments: { type: Number },
    monthlyAmount: { type: Number },
    nextDueDate: { type: Date },
    nextAmountDue: { type: Number }
  },
  shopName: { type: String, default: "" },
  shopAddress: { type: String, default: "" },
  shopPhone: { type: String, default: "" },
  receiptHeader: { type: String, default: "" },
  receiptFooter: { type: String, default: "" },
  notes: { type: String, default: "" },
  isPrinted: { type: Boolean, default: false },
  printCount: { type: Number, default: 0 }
}, { timestamps: true });

receiptSchema.index({ receiptDate: 1 });
receiptSchema.index({ customerId: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
