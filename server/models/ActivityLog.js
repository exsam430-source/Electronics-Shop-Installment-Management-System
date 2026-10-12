const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // create, update, delete, login, logout, backup, print
  module: { type: String, required: true }, // product, sale, installment, customer, supplier, payment, setting
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String, default: "localhost" }
});

activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
