const mongoose = require('mongoose');

const backupLogSchema = new mongoose.Schema({
  backupDate: { type: Date, default: Date.now },
  backupPath: { type: String, required: true },
  backupSize: { type: String, default: "0 KB" },
  backupType: { type: String, enum: ['manual', 'auto'], default: 'manual' },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('BackupLog', backupLogSchema);
