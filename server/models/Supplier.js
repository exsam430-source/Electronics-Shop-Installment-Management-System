const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierCode: { type: String, required: true, unique: true }, // e.g. SUP-001
  supplierName: { type: String, required: true, trim: true },
  contactPerson: { type: String, default: "" },
  phone: { type: String, required: true },
  mobile: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  balance: { type: Number, default: 0 }, // Outstanding balance owed to supplier
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
