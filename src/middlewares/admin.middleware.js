const { forbiddenResponse } = require('../utils/response');
const { MESSAGES, ROLES } = require('../config/constants');

/**
 * Middleware to check if user is admin
 * Must be used after authenticateToken middleware
 */
const isAdmin = (req, res, next) => {
  try {
    // Check if user exists (should be set by authenticateToken middleware)
    if (!req.user) {
      return forbiddenResponse(res, MESSAGES.UNAUTHORIZED);
    }

    // Check if user role is admin
    if (req.user.role !== ROLES.ADMIN) {
      return forbiddenResponse(res, MESSAGES.ADMIN_ONLY);
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error.message);
    return forbiddenResponse(res, MESSAGES.ADMIN_ONLY);
  }
};

module.exports = isAdmin;
