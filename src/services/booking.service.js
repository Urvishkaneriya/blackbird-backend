const Booking = require('../models/booking.model');
const userService = require('./user.service');
const branchService = require('./branch.service');
const employeeService = require('./employee.service');

class BookingService {
  /**
   * Create new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} Created booking document
   */
  async createBooking(bookingData) {
    const {
      phone,
      email,
      fullName,
      amount,
      artistName,
      paymentMethod,
      branchId,
      employeeId,
    } = bookingData;

    // Verify branch exists
    const branch = await branchService.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    // Verify employee exists
    const employee = await employeeService.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Find or create user by phone
    let user = await userService.findByPhone(phone);

    if (user) {
      // User exists - update email if provided and different
      if (email && email !== user.email) {
        await userService.updateUserEmail(user._id, email);
      }
      // Update user stats (increment orders and amount)
      await userService.updateUserStats(user._id, amount);
    } else {
      // User doesn't exist - create new user
      user = await userService.createUser({
        fullName,
        phone,
        email,
      });
      // Update stats for first order
      await userService.updateUserStats(user._id, amount);
    }

    // Create booking
    const booking = new Booking({
      phone,
      email,
      fullName,
      amount,
      artistName,
      paymentMethod,
      branchId,
      employeeId,
      userId: user._id,
      date: new Date(),
    });

    return await booking.save();
  }

  /**
   * Get all bookings
   * @returns {Promise<Array>} Array of booking documents
   */
  async getAllBookings() {
    return await Booking.find()
      .populate('branchId', 'name branchNumber')
      .populate('employeeId', 'fullName employeeNumber')
      .populate('userId', 'fullName phone email')
      .sort({ date: -1 });
  }

  /**
   * Get bookings by branch
   * @param {String} branchId - Branch ID
   * @returns {Promise<Array>} Array of booking documents
   */
  async getBookingsByBranch(branchId) {
    return await Booking.find({ branchId })
      .populate('branchId', 'name branchNumber')
      .populate('employeeId', 'fullName employeeNumber')
      .populate('userId', 'fullName phone email')
      .sort({ date: -1 });
  }

  /**
   * Get bookings by employee
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Array>} Array of booking documents
   */
  async getBookingsByEmployee(employeeId) {
    return await Booking.find({ employeeId })
      .populate('branchId', 'name branchNumber')
      .populate('employeeId', 'fullName employeeNumber')
      .populate('userId', 'fullName phone email')
      .sort({ date: -1 });
  }

  /**
   * Find booking by ID
   * @param {String} id - Booking ID
   * @returns {Promise<Object>} Booking document
   */
  async findById(id) {
    return await Booking.findById(id)
      .populate('branchId', 'name branchNumber')
      .populate('employeeId', 'fullName employeeNumber')
      .populate('userId', 'fullName phone email');
  }

  /**
   * Count bookings
   * @returns {Promise<Number>} Number of bookings
   */
  async countBookings() {
    return await Booking.countDocuments();
  }

  /**
   * Count bookings by branch
   * @param {String} branchId - Branch ID
   * @returns {Promise<Number>} Number of bookings
   */
  async countBookingsByBranch(branchId) {
    return await Booking.countDocuments({ branchId });
  }
}

module.exports = new BookingService();
