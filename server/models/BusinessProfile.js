const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
  shopName: { type: String, default: "MR SOLVER Electronics" },
  ownerName: { type: String, default: "Shop Administrator" },
  address: { type: String, default: "Main Electronics Market, Road #1" },
  city: { type: String, default: "Lahore" },
  phone: { type: String, default: "+92 300 0000000" },
  mobile: { type: String, default: "+92 300 1234567" },
  email: { type: String, default: "contact@mrsolver.com" },
  logo: { type: String, default: "" }, // Base64 data URL or local path
  receiptHeader: { type: String, default: "Quality Electronics & Easy Installments" },
  receiptFooter: { type: String, default: "Thank you for shopping with us! Terms & Conditions apply." },
  defaultCommissionRate: { type: Number, default: 1 }, // 1%
  currency: { type: String, default: "Rs." },
  lowStockThreshold: { type: Number, default: 2 },
  printerType: { 
    type: String, 
    enum: ['thermal_80', 'thermal_58', 'a4'], 
    default: 'thermal_80' 
  },
  lateFeeSettings: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    amount: { type: Number, default: 500 },
    percentage: { type: Number, default: 2 },
    graceDays: { type: Number, default: 10 },
    frequency: { type: String, enum: ['once', 'monthly'], default: 'once' }
  },
  autoBackup: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    day: { type: String, default: 'Monday' },
    time: { type: String, default: '23:00' },
    keepLast: { type: Number, default: 12 },
    backupPath: { type: String, default: 'data/backups' }
  }
}, { timestamps: true });

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
