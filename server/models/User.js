const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: 'admin', enum: ['admin'] },
  securityQuestion: { type: String, default: "What is your primary shop location?" },
  securityAnswerHash: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
