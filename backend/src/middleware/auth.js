// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT authentication middleware.
 * Extracts and verifies Bearer token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid token.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    logger.warn(`Invalid token attempt: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Role-based authorization middleware factory.
 * @param {...string} roles - Allowed roles (e.g., 'collector', 'recycler', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.', code: 'AUTH_REQUIRED' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
      code: 'FORBIDDEN',
    });
  }
  next();
};

module.exports = { authenticate, authorize };
