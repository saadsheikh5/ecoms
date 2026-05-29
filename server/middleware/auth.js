const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ApiError = require('../utils/apiError');

// Protect routes — only logged-in admins can access
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('Not authorized. Please log in.', 401));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find admin in database
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return next(new ApiError('Admin no longer exists.', 401));
    }

    if (admin.changedPasswordAfter(decoded.iat)) {
      return next(new ApiError('Password was changed recently. Please log in again.', 401));
    }

    // Attach admin to request object so controllers can use it
    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
