const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');
const { JWT_SECRET } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Check if first-time setup is required (no admin user exists)
const checkSetupStatus = async (req, res) => {
  try {
    const adminCount = await User.countDocuments();
    const businessProfile = await BusinessProfile.findOne();
    return res.json({
      success: true,
      needsSetup: adminCount === 0,
      shopName: businessProfile ? businessProfile.shopName : 'MR SOLVER Electronics'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// First-time setup wizard execution
const setupInitialAdmin = async (req, res) => {
  try {
    const adminCount = await User.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({ success: false, message: 'Setup already completed. Please login.' });
    }

    const { username, password, fullName, shopName, ownerName, phone, address, city, securityQuestion, securityAnswer } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Username, password and full name are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    let securityAnswerHash = null;
    if (securityAnswer) {
      securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), salt);
    }

    const user = await User.create({
      username: username.trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: 'admin',
      securityQuestion: securityQuestion || 'What is your primary shop location?',
      securityAnswerHash,
      isActive: true,
      lastLogin: new Date()
    });

    // Update or create business profile
    await BusinessProfile.findOneAndUpdate({}, {
      shopName: shopName || 'MR SOLVER Electronics',
      ownerName: ownerName || fullName,
      phone: phone || '+92 300 0000000',
      address: address || 'Main Market',
      city: city || 'Lahore'
    }, { upsert: true, new: true });

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    await logActivity(req, 'create', 'auth', `Initial administrator setup completed by ${user.username}`, user._id);

    return res.status(201).json({
      success: true,
      message: 'Initial administrator created successfully.',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Administrator login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password.' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    await logActivity(req, 'login', 'auth', `Administrator ${user.username} logged in`, user._id);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get current authenticated user session
const getMe = async (req, res) => {
  try {
    const businessProfile = await BusinessProfile.findOne();
    return res.json({
      success: true,
      user: req.user,
      businessProfile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logActivity(req, 'update', 'auth', `Password changed by ${user.username}`, user._id);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Password recovery using security question
const recoverPassword = async (req, res) => {
  try {
    const { username, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.securityAnswerHash) {
      return res.status(400).json({ success: false, message: 'No security question set for recovery.' });
    }

    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswerHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Security answer does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logActivity(req, 'update', 'auth', `Password recovered via security question for ${user.username}`, user._id);

    return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkSetupStatus,
  setupInitialAdmin,
  login,
  getMe,
  changePassword,
  recoverPassword
};
