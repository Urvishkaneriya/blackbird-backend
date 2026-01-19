const { serverErrorResponse } = require('../utils/response');
const { MESSAGES } = require('../config/constants');

/**
 * Global error handling middleware
 * Catches all errors and sends standardized error response
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      message: 'Validation error',
      data: { errors },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      message: `${field} already exists`,
      data: null,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      data: null,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: MESSAGES.TOKEN_INVALID,
      data: null,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token has expired',
      data: null,
    });
  }

  // Default error response
  return serverErrorResponse(
    res,
    err.message || MESSAGES.SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

/**
 * 404 Not Found middleware
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
    data: null,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
