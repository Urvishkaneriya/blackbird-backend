const bcrypt = require('bcrypt');
const { BCRYPT_SALT_ROUNDS } = require('../config/constants');

/**
 * Hash a password
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hashedPassword - Hashed password to compare against
 * @returns {Promise<Boolean>} True if password matches
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
