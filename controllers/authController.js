const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendResetOtpEmail } = require('../utils/emailService');

const createToken = (user) => {
  const secret = process.env.JWT_SECRET || 'blogapp-dev-secret';

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      name: user.name,
    },
    secret,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, profilePic } = req.body;

    // ── Field presence check ──────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    // ── Password rules: min 8 chars + at least one special character ──
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
    if (!specialCharRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one special character (e.g. #, @, !)' });
    }

    // ── Unique email check ────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      profilePic,
    });

    const token = createToken(user);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (race condition fallback)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// ── Forgot Password: generate OTP and email it ───────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success to avoid user enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
    }

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = expiry;
    await user.save();

    await sendResetOtpEmail(user.email, otp, user.name);

    return res.status(200).json({ success: true, message: 'OTP sent to your email. It expires in 15 minutes.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

// ── Verify OTP: verify the 6-digit code at step 2 ────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid OTP or session has expired.' });
    }

    // Check expiry
    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP match
    const otpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!otpValid) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please check and try again.' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
};

// ── Reset Password: verify OTP and set new password ──────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }

    // Enforce password rules
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    const specialCharRegex = /[!@#$%^&*()\-_=+{};:,<.>/?`~|[\]\\'"]/;
    if (!specialCharRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one special character' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Check expiry
    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    const otpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!otpValid) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Hash and save new password, clear OTP fields
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};
