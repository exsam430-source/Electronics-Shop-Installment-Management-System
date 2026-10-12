const mongoose = require('mongoose');

const cashSaleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  brand: { type: String, default: "" },
  modelNumber: { type: String, default: "" },
  serialNumber: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const cashSaleSchema = new mongoose.Schema({
  saleNumber: { type: String, required: true, unique: true }, // e.g. CS-20260001
  saleDate: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', default: null },
  items: [cashSaleItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, default: 'cash' }, // cash, bank_transfer, mobile_wallet, cheque, other
  amountReceived: { type: Number, required: true, min: 0 },
  changeReturned: { type: Number, default: 0 },
  purchasePrice: { type: Number, required: true, min: 0 }, // Total cost of items
  profit: { type: Number, required: true }, // totalAmount - purchasePrice
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
  notes: { type: String, default: "" }
}, { timestamps: true });

cashSaleSchema.index({ saleDate: 1 });
cashSaleSchema.index({ customerId: 1 });

module.exports = mongoose.model('CashSale', cashSaleSchema);
