const mongoose = require('mongoose');

const productUnitSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  serialNumber: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['available', 'sold', 'reserved', 'damaged', 'returned'], 
    default: 'available' 
  },
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  saleType: { type: String, enum: ['cash', 'installment', null], default: null },
  saleId: { type: mongoose.Schema.Types.ObjectId, default: null },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  soldDate: { type: Date, default: null },
  notes: { type: String, default: "" }
}, { timestamps: true });

productUnitSchema.index({ serialNumber: 1 });
productUnitSchema.index({ productId: 1, status: 1 });

module.exports = mongoose.model('ProductUnit', productUnitSchema);
