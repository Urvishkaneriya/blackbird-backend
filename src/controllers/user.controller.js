const userService = require('../services/user.service');
const { successResponse } = require('../utils/response');
const { MESSAGES } = require('../config/constants');

class UserController {
  /**
   * Get all users (customers)
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();

      return successResponse(res, MESSAGES.USERS_FETCHED, {
        count: users.length,
        users,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
