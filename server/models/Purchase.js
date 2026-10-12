const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  serialNumbers: [{ type: String, trim: true }]
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, required: true, unique: true }, // PUR-0001
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  purchaseDate: { type: Date, default: Date.now },
  items: [purchaseItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  balanceRemaining: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash' },
  notes: { type: String, default: "" }
}, { timestamps: true });

purchaseSchema.index({ supplierId: 1 });
purchaseSchema.index({ purchaseDate: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
