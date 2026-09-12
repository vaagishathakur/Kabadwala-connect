// src/middleware/errorHandler.js
const logger = require('../utils/logger');

/**
 * Global Express error handler middleware.
 * Must be the last middleware registered.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }

  // Express-validator errors (passed via next(err))
  if (err.status === 400 && err.errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.errors,
    });
  }

  // Generic server error
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    code: err.code || 'SERVER_ERROR',
  });
};

/**
 * 404 Not Found handler — register before errorHandler.
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
};

module.exports = { errorHandler, notFound };
