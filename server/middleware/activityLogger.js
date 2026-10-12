const ActivityLog = require('../models/ActivityLog');

const logActivity = async (req, action, moduleName, description, referenceId = null) => {
  try {
    const userId = req.user ? req.user._id : null;
    await ActivityLog.create({
      userId,
      action,
      module: moduleName,
      referenceId,
      description,
      ipAddress: req.ip || 'localhost'
    });
  } catch (err) {
    console.error('[ActivityLog Error]:', err.message);
  }
};

module.exports = { logActivity };
