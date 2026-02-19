const bookingService = require('../services/booking.service');
const employeeService = require('../services/employee.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
} = require('../utils/response');
const { MESSAGES, ROLES } = require('../config/constants');

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
        size,
        artistName,
        branchId,
        items,
        payment,
      } = req.body;

      // Validation (employeeId = creator, set from token)
      if (!phone || !fullName || !artistName || !branchId) {
        return badRequestResponse(
          res,
          'Required fields: phone, fullName, artistName, branchId'
        );
      }

      if (!Array.isArray(items) || items.length === 0) {
        return badRequestResponse(res, MESSAGES.INVALID_BOOKING_ITEMS);
      }

      if (!payment || typeof payment !== 'object') {
        return badRequestResponse(res, MESSAGES.INVALID_PAYMENT_BREAKDOWN);
      }

      // Create booking (employeeId = creator id from token - admin or employee)
      const booking = await bookingService.createBooking({
        phone,
        email,
        fullName,
        size,
        artistName,
        branchId,
        items,
        payment,
        employeeId: req.user.id,
      });

      return createdResponse(res, MESSAGES.BOOKING_CREATED, booking);
    } catch (error) {
      if (error.message === 'Branch not found') {
        return notFoundResponse(res, 'Branch not found');
      }
      if (
        error.message === 'At least one booking item is required' ||
        error.message.includes('item') ||
        error.message.includes('product') ||
        error.message.includes('quantity')
      ) {
        return badRequestResponse(res, error.message);
      }
      if (error.message.includes('Payment') || error.message.includes('payment')) {
        return badRequestResponse(res, error.message);
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
