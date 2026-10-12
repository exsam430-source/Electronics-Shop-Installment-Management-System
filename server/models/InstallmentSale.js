const mongoose = require('mongoose');

const installmentItemSchema = new mongoose.Schema({
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

const installmentSaleSchema = new mongoose.Schema({
  saleNumber: { type: String, required: true, unique: true }, // e.g. IS-20260001
  saleDate: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', default: null },
  items: [installmentItemSchema],
  totalSaleAmount: { type: Number, required: true, min: 0 },
  totalPurchaseCost: { type: Number, required: true, min: 0 },
  advancePayment: { type: Number, default: 0, min: 0 },
  firstInstallmentCollected: { type: Boolean, default: false },
  firstInstallmentAmount: { type: Number, default: 0, min: 0 },
  totalCollectedAtSale: { type: Number, default: 0, min: 0 },
  remainingBalance: { type: Number, required: true, min: 0 },
  installmentDuration: { type: Number, required: true, enum: [3, 6, 9, 12] },
  numberOfInstallments: { type: Number, required: true },
  monthlyInstallmentAmount: { type: Number, required: true },
  firstDueDate: { type: Date, required: true },
  accountStatus: { 
    type: String, 
    enum: ['active', 'completed', 'overdue', 'defaulted'], 
    default: 'active' 
  },
  totalAmountPaid: { type: Number, default: 0 },
  totalRemainingBalance: { type: Number, required: true },
  profit: { type: Number, required: true }, // totalSaleAmount - totalPurchaseCost
  advanceReceiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
  firstInstallmentReceiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
  notes: { type: String, default: "" }
}, { timestamps: true });

installmentSaleSchema.index({ customerId: 1 });
installmentSaleSchema.index({ accountStatus: 1 });
installmentSaleSchema.index({ saleDate: 1 });

module.exports = mongoose.model('InstallmentSale', installmentSaleSchema);
