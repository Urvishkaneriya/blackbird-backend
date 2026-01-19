const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/constants');

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_CONFIG.EXPIRY,
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode JWT token without verification
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Check if token needs refresh
 * @param {String} token - JWT token to check
 * @returns {Boolean} True if token should be refreshed
 */
const shouldRefreshToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    const hoursLeft = timeLeft / 3600;

    // Refresh if less than threshold hours left
    return hoursLeft < JWT_CONFIG.REFRESH_THRESHOLD_HOURS && hoursLeft > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Get token expiry time in hours
 * @param {String} token - JWT token
 * @returns {Number} Hours until token expires
 */
const getTokenExpiryHours = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    return timeLeft / 3600;
  } catch (error) {
    return 0;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  shouldRefreshToken,
  getTokenExpiryHours,
};
