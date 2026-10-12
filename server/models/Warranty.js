const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimDate: { type: Date, default: Date.now },
  issue: { type: String, required: true },
  resolution: { type: String, default: "" },
  status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' }
}, { _id: true });

const warrantySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  serialNumber: { type: String, required: true },
  warrantyDuration: { type: Number, required: true }, // months
  warrantyStartDate: { type: Date, default: Date.now },
  warrantyEndDate: { type: Date, required: true },
  warrantyStatus: { 
    type: String, 
    enum: ['active', 'expired', 'claimed', 'void'], 
    default: 'active' 
  },
  claims: [claimSchema]
}, { timestamps: true });

warrantySchema.index({ serialNumber: 1 });
warrantySchema.index({ customerId: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);
