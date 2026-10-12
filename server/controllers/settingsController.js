const BusinessProfile = require('../models/BusinessProfile');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const { setupAutoBackupSchedule } = require('../utils/backupService');
const { logActivity } = require('../middleware/activityLogger');

const getSettings = async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne();
    if (!profile) {
      profile = await BusinessProfile.create({ shopName: 'MR SOLVER Electronics' });
    }

    const settingsList = await Settings.find();
    return res.json({
      success: true,
      profile,
      settings: settingsList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateBusinessProfile = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      address,
      city,
      phone,
      mobile,
      email,
      logo,
      receiptHeader,
      receiptFooter,
      defaultCommissionRate,
      currency,
      lowStockThreshold,
      printerType
    } = req.body;

    let profile = await BusinessProfile.findOne();
    if (!profile) {
      profile = new BusinessProfile({});
    }

    if (shopName) profile.shopName = shopName.trim();
    if (ownerName) profile.ownerName = ownerName.trim();
    if (address !== undefined) profile.address = address;
    if (city !== undefined) profile.city = city;
    if (phone !== undefined) profile.phone = phone;
    if (mobile !== undefined) profile.mobile = mobile;
    if (email !== undefined) profile.email = email;
    if (logo !== undefined) profile.logo = logo; // Data URL or path
    if (receiptHeader !== undefined) profile.receiptHeader = receiptHeader;
    if (receiptFooter !== undefined) profile.receiptFooter = receiptFooter;
    if (defaultCommissionRate !== undefined) profile.defaultCommissionRate = Number(defaultCommissionRate);
    if (currency !== undefined) profile.currency = currency;
    if (lowStockThreshold !== undefined) profile.lowStockThreshold = Number(lowStockThreshold);
    if (printerType && ['thermal_80', 'thermal_58', 'a4'].includes(printerType)) {
      profile.printerType = printerType;
    }

    await profile.save();
    await logActivity(req, 'update', 'setting', `Updated Business Profile: ${profile.shopName}`, profile._id);

    return res.json({ success: true, message: 'Business profile updated successfully.', profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateLateFeeSettings = async (req, res) => {
  try {
    const { enabled, type, amount, percentage, graceDays, frequency } = req.body;

    let profile = await BusinessProfile.findOne();
    if (!profile) {
      profile = new BusinessProfile({});
    }

    profile.lateFeeSettings = {
      enabled: !!enabled,
      type: type === 'percentage' ? 'percentage' : 'fixed',
      amount: Number(amount) || 500,
      percentage: Number(percentage) || 2,
      graceDays: Number(graceDays) || 10,
      frequency: frequency === 'monthly' ? 'monthly' : 'once'
    };

    await profile.save();
    await logActivity(req, 'update', 'setting', `Updated Late Fee Settings (Enabled: ${profile.lateFeeSettings.enabled})`, profile._id);

    return res.json({ success: true, message: 'Late fee settings saved.', lateFeeSettings: profile.lateFeeSettings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAutoBackupSettings = async (req, res) => {
  try {
    const { enabled, frequency, day, time, keepLast, backupPath } = req.body;

    let profile = await BusinessProfile.findOne();
    if (!profile) {
      profile = new BusinessProfile({});
    }

    profile.autoBackup = {
      enabled: !!enabled,
      frequency: frequency || 'weekly',
      day: day || 'Monday',
      time: time || '23:00',
      keepLast: Number(keepLast) || 12,
      backupPath: backupPath || 'data/backups'
    };

    await profile.save();
    await setupAutoBackupSchedule(); // Re-apply schedule

    await logActivity(req, 'update', 'setting', `Updated Auto-Backup settings (${profile.autoBackup.frequency})`, profile._id);

    return res.json({ success: true, message: 'Auto backup settings updated.', autoBackup: profile.autoBackup });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { module, action, limit = 100 } = req.query;
    let query = {};
    if (module) query.module = module;
    if (action) query.action = action;

    const logs = await ActivityLog.find(query)
      .populate('userId', 'username fullName')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateBusinessProfile,
  updateLateFeeSettings,
  updateAutoBackupSettings,
  getActivityLogs
};
