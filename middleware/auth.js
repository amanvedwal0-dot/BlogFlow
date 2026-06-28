const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.auth = async (req, res, next) => {
  try {
    const authorization = req.header('Authorization');
    if (!authorization) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const token = authorization.replace('Bearer ', '').trim();
    const secret = process.env.JWT_SECRET || 'blogapp-dev-secret';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token user' });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized', error: error.message });
  }
};