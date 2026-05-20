const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, generateOtpAndExpiry } = require('../utils/email');

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { email, password, phone, type } = req.body;
    if (type !== 'doctor') return res.status(400).json({ success: false, message: 'Only doctors can register' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });

    const user = new User({ email, password, phone, type });
    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Doctor account created',
      token,
      user: { id: user._id, email: user.email, phone: user.phone, type: user.type }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, type: user.type, totalScore: user.totalScore, level: user.level }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { otp, otpExpiry } = generateOtpAndExpiry();
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.json({ success: true, message: 'OTP sent. Valid for 5 minutes.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
  }
};

exports.verifyOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.resetOTP !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.resetOTPExpiry < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });

    user.password = newPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Reset error', error: error.message });
  }
};
