const { verifyToken, shouldRefreshToken, generateToken } = require('../utils/jwt');
const { unauthorizedResponse } = require('../utils/response');
const { MESSAGES, ROLES } = require('../config/constants');
const authService = require('../services/auth.service');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, MESSAGES.TOKEN_REQUIRED);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return unauthorizedResponse(res, MESSAGES.TOKEN_REQUIRED);
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return unauthorizedResponse(res, MESSAGES.TOKEN_INVALID);
    }

    // Verify user exists
    try {
      const user = await authService.verifyUser(decoded.id, decoded.role);
      
      // Attach user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      if (decoded.role === ROLES.EMPLOYEE && user.branchId) {
        req.user.branchId = user.branchId.toString();
      }
    } catch (error) {
      return unauthorizedResponse(res, MESSAGES.UNAUTHORIZED);
    }

    // Check if token needs refresh
    if (shouldRefreshToken(token)) {
      const newTokenPayload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      const newToken = generateToken(newTokenPayload);
      
      // Set new token in response header
      res.setHeader('X-New-Token', newToken);
      console.log(`🔄 Token refreshed for user: ${decoded.email}`);
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return unauthorizedResponse(res, MESSAGES.UNAUTHORIZED);
  }
};

module.exports = authenticateToken;
