const dashboardService = require('../services/dashboard.service');
const { successResponse, badRequestResponse } = require('../utils/response');
const { MESSAGES, ROLES } = require('../config/constants');

/**
 * Get dashboard data for date range.
 * Admin: full dashboard (summary, byBranch, byPaymentMethod, byPaymentMode, topProducts, totals).
 * Employee: branch dashboard for assigned branch (branchInfo, summary, byPaymentMethod, byPaymentMode, topProducts).
 * GET /api/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
async function getDashboard(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return badRequestResponse(res, MESSAGES.DASHBOARD_DATE_RANGE_REQUIRED);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return badRequestResponse(res, 'Invalid date format. Use YYYY-MM-DD.');
    }

    if (start > end) {
      return badRequestResponse(res, 'startDate must be before or equal to endDate.');
    }

    const isEmployee = req.user.role === ROLES.EMPLOYEE;
    if (isEmployee && !req.user.branchId) {
      return badRequestResponse(res, 'Your account is not assigned to a branch.');
    }

    const data = isEmployee
      ? await dashboardService.getBranchDashboardData(start, end, req.user.branchId)
      : await dashboardService.getDashboardData(start, end);

    return successResponse(res, MESSAGES.DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
};
