const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', required: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  saleNumber: { type: String, default: "" },
  saleType: { type: String, enum: ['cash_sale', 'installment_sale'], required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  productDetails: { type: String, default: "" },
  sellingPrice: { type: Number, required: true }, // The actual selling price
  commissionRate: { type: Number, required: true }, // e.g. 1 for 1%
  commissionAmount: { type: Number, required: true }, // sellingPrice * (commissionRate / 100)
  status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  saleDate: { type: Date, default: Date.now }
}, { timestamps: true });

commissionSchema.index({ referralPartnerId: 1, status: 1 });
commissionSchema.index({ saleDate: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
