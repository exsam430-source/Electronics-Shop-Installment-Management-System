const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  serialNumber: { type: String, default: "" },
  quantity: { type: Number, required: true, default: 1 },
  returnReason: { type: String, default: "" }
}, { _id: false });

const returnSchema = new mongoose.Schema({
  returnNumber: { type: String, required: true, unique: true }, // RET-20260001
  returnDate: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  saleNumber: { type: String, default: "" },
  saleType: { type: String, enum: ['cash_sale', 'installment_sale'], required: true },
  returnType: { 
    type: String, 
    enum: ['return', 'exchange', 'damaged', 'warranty'], 
    default: 'return' 
  },
  items: [returnItemSchema],
  refundAmount: { type: Number, default: 0 },
  exchangeProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  exchangeSerialNumber: { type: String, default: "" },
  installmentAdjustment: { type: Number, default: 0 },
  stockAdjusted: { type: Boolean, default: true },
  notes: { type: String, default: "" }
}, { timestamps: true });

returnSchema.index({ customerId: 1 });
returnSchema.index({ returnDate: 1 });

module.exports = mongoose.model('Return', returnSchema);
