const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Auth error' });
  }
};

exports.doctorOnly = async (req, res, next) => {
  if (req.user && req.user.type === 'doctor') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Doctors only' });
  }
};
