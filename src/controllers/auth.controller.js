const authService = require('../services/auth.service');
const { successResponse, badRequestResponse, unauthorizedResponse } = require('../utils/response');
const { MESSAGES } = require('../config/constants');

class AuthController {
  /**
   * Login endpoint for both admin and employee
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return badRequestResponse(res, 'Email and password are required');
      }

      // Login
      const result = await authService.login(email, password);

      return successResponse(res, MESSAGES.LOGIN_SUCCESS, result);
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return unauthorizedResponse(res, MESSAGES.INVALID_CREDENTIALS);
      }
      next(error);
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      // Fetch full user details from database
      const user = await authService.verifyUser(req.user.id, req.user.role);

      if (!user) {
        return unauthorizedResponse(res, 'User not found');
      }

      // Return full user data (password is excluded by model's toJSON)
      return successResponse(res, 'User information fetched successfully', user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
