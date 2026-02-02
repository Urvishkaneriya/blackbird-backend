const userService = require('../services/user.service');
const { successResponse } = require('../utils/response');
const { MESSAGES } = require('../config/constants');

class UserController {
  /**
   * Get all users (customers)
   * GET /api/users?branchId=&page=&limit=
   */
  async getAllUsers(req, res, next) {
    try {
      const { branchId, page, limit } = req.query;
      const { users, total } = await userService.getUsers({ branchId, page, limit });
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
      const safePage = Math.max(1, parseInt(page, 10) || 1);
      return successResponse(res, MESSAGES.USERS_FETCHED, {
        count: users.length,
        total,
        page: safePage,
        limit: safeLimit,
        users,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
