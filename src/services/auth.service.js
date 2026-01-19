const adminService = require('./admin.service');
const employeeService = require('./employee.service');
const { comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/jwt');
const { ROLES } = require('../config/constants');

class AuthService {
  /**
   * Login user (admin or employee)
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Promise<Object>} User data and token
   */
  async login(email, password) {
    // First, try to find admin
    let user = await adminService.findByEmail(email);
    let userRole = ROLES.ADMIN;

    // If not admin, try to find employee
    if (!user) {
      user = await employeeService.findByEmail(email);
      userRole = ROLES.EMPLOYEE;
    }

    // If user not found
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: userRole,
    };

    const token = generateToken(tokenPayload);

    // Prepare user data (without password)
    const userData = {
      id: user._id,
      name: user.name || user.fullName,
      email: user.email,
      role: userRole,
    };

    // Add employee-specific fields if employee
    if (userRole === ROLES.EMPLOYEE) {
      userData.employeeNumber = user.employeeNumber;
      userData.uniqueId = user.uniqueId;
      userData.phoneNumber = user.phoneNumber;
    }

    return {
      token,
      user: userData,
    };
  }

  /**
   * Verify user by ID and role
   * @param {String} userId - User ID
   * @param {String} role - User role
   * @returns {Promise<Object>} User document
   */
  async verifyUser(userId, role) {
    let user;

    if (role === ROLES.ADMIN) {
      user = await adminService.findById(userId);
    } else if (role === ROLES.EMPLOYEE) {
      user = await employeeService.findById(userId);
    }

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();
