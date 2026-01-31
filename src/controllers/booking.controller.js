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
   * GET /api/bookings
   * Admin sees all bookings, Employee sees their branch bookings
   */
  async getBookings(req, res, next) {
    try {
      let bookings;

      // Check user role
      if (req.user.role === ROLES.ADMIN) {
        // Admin sees all bookings
        bookings = await bookingService.getAllBookings();
      } else if (req.user.role === ROLES.EMPLOYEE) {
        // Employee sees their branch bookings
        const employee = await employeeService.findById(req.user.id);
        
        if (!employee) {
          return notFoundResponse(res, 'Employee not found');
        }

        bookings = await bookingService.getBookingsByBranch(employee.branchId);
      } else {
        return badRequestResponse(res, 'Invalid user role');
      }

      return successResponse(res, MESSAGES.BOOKINGS_FETCHED, {
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
