const bookingService = require('../services/booking.service');
const employeeService = require('../services/employee.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
} = require('../utils/response');
const { MESSAGES, ROLES, PAYMENT_METHODS } = require('../config/constants');

class BookingController {
  /**
   * Create new booking
   * POST /api/bookings
   */
  async createBooking(req, res, next) {
    try {
      const {
        phone,
        email,
        fullName,
        amount,
        size,
        artistName,
        paymentMethod,
        branchId,
      } = req.body;

      // Validation (employeeId = creator, set from token)
      if (!phone || !fullName || !amount || size === undefined || size === null || !artistName || !paymentMethod || !branchId) {
        return badRequestResponse(
          res,
          'All required fields must be provided (phone, fullName, amount, size, artistName, paymentMethod, branchId)'
        );
      }

      // Validate payment method
      if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
        return badRequestResponse(
          res,
          `Payment method must be either ${PAYMENT_METHODS.CASH} or ${PAYMENT_METHODS.UPI}`
        );
      }

      // Create booking (employeeId = creator id from token - admin or employee)
      const booking = await bookingService.createBooking({
        phone,
        email,
        fullName,
        amount,
        size,
        artistName,
        paymentMethod,
        branchId,
        employeeId: req.user.id,
      });

      return createdResponse(res, MESSAGES.BOOKING_CREATED, booking);
    } catch (error) {
      if (error.message === 'Branch not found') {
        return notFoundResponse(res, 'Branch not found');
      }
      next(error);
    }
  }

  /**
   * Get bookings
   * GET /api/bookings?branchId=&startDate=&endDate=&page=&limit=
   * Admin: all (optional branchId). Employee: their branch only.
   */
  async getBookings(req, res, next) {
    try {
      const { branchId, startDate, endDate, page, limit } = req.query;
      const filters = { startDate, endDate, page, limit };

      if (req.user.role === ROLES.ADMIN) {
        if (branchId) filters.branchId = branchId;
        const { bookings, total } = await bookingService.getAllBookings(filters);
        return successResponse(res, MESSAGES.BOOKINGS_FETCHED, {
          count: bookings.length,
          total,
          page: Math.max(1, parseInt(page, 10) || 1),
          limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
          bookings,
        });
      }
      if (req.user.role === ROLES.EMPLOYEE) {
        const employee = await employeeService.findById(req.user.id);
        if (!employee) return notFoundResponse(res, 'Employee not found');
        const { bookings, total } = await bookingService.getBookingsByBranch(employee.branchId, filters);
        return successResponse(res, MESSAGES.BOOKINGS_FETCHED, {
          count: bookings.length,
          total,
          page: Math.max(1, parseInt(page, 10) || 1),
          limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
          bookings,
        });
      }
      return badRequestResponse(res, 'Invalid user role');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
