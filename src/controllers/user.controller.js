const userService = require('../services/user.service');
const { successResponse, badRequestResponse } = require('../utils/response');
const { MESSAGES, ROLES } = require('../config/constants');

class UserController {
  /**
   * Get all users (customers)
   * GET /api/users?branchId=&birthday=&page=&limit=
   */
  async getAllUsers(req, res, next) {
    try {
      const { branchId, birthday, page, limit } = req.query;
      const filters = { birthday, page, limit };

      if (req.user.role === ROLES.ADMIN) {
        if (branchId) filters.branchId = branchId;
      } else if (req.user.role === ROLES.EMPLOYEE) {
        if (!req.user.branchId) {
          return badRequestResponse(res, 'Employee is not assigned to any branch');
        }
        filters.branchId = req.user.branchId;
      } else {
        return badRequestResponse(res, 'Invalid user role');
      }

      const { users, total } = await userService.getUsers(filters);
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
      if (error.message === 'Invalid birthday format. Use YYYY-MM-DD.') {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  }
}

module.exports = new UserController();
