const Booking = require('../models/booking.model');
const userService = require('./user.service');
const branchService = require('./branch.service');
const employeeService = require('./employee.service');
const whatsappService = require('./whatsapp.service');
const settingsService = require('./settings.service');

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
      size,
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

    // employeeId = creator id (admin or employee), no ref validation

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

    // Create booking (employeeId = creator id - admin or employee from token)
    const booking = new Booking({
      phone,
      email,
      fullName,
      amount,
      size,
      artistName,
      paymentMethod,
      branchId,
      employeeId,
      userId: user._id,
      date: new Date(),
    });

    const savedBooking = await booking.save();

    // Send WhatsApp invoice to customer and optionally to self (don't fail booking if this fails)
    try {
      const bookingWithBranch = await Booking.findById(savedBooking._id)
        .populate('branchId', 'name branchNumber');
      const settings = await settingsService.getSettings();
      const payload = {
        bookingNumber: bookingWithBranch.bookingNumber,
        fullName: bookingWithBranch.fullName,
        amount: bookingWithBranch.amount,
        size: bookingWithBranch.size,
        paymentMethod: bookingWithBranch.paymentMethod,
        artistName: bookingWithBranch.artistName,
        date: bookingWithBranch.date,
        branchId: bookingWithBranch.branchId,
      };

      if (settings.whatsappEnabled) {
        await whatsappService.sendInvoiceMessage('+91' + phone.replace(/\D/g, '').replace(/^91/, ''), payload);
      }
      if (settings.whatsappEnabled && settings.selfInvoiceMessageEnabled && process.env.WHATSAPP_NUM) {
        const selfNum = process.env.WHATSAPP_NUM.replace(/\D/g, '').replace(/^91/, '');
        if (selfNum) {
          await whatsappService.sendInvoiceMessage('+91' + selfNum, payload);
        }
      }
    } catch (whatsappError) {
      console.error('⚠️ WhatsApp notification failed, but booking was created:', whatsappError.message);
    }

    return savedBooking;
  }

  /**
   * Get all bookings with optional filters (branchId, startDate, endDate, pagination)
   * @param {Object} filters - { branchId?, startDate?, endDate?, page?, limit? }
   * @returns {Promise<{ bookings: Array, total: Number }>}
   */
  async getAllBookings(filters = {}) {
    const { branchId, startDate, endDate, page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const query = {};
    if (branchId) query.branchId = branchId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate).setHours(0, 0, 0, 0);
      if (endDate) query.date.$lte = new Date(endDate).setHours(23, 59, 59, 999);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('branchId', 'name branchNumber')
        .populate('userId', 'fullName phone email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Booking.countDocuments(query),
    ]);
    return { bookings, total };
  }

  /**
   * Get bookings by branch with optional date filter and pagination
   * @param {String} branchId - Branch ID
   * @param {Object} filters - { startDate?, endDate?, page?, limit? }
   * @returns {Promise<{ bookings: Array, total: Number }>}
   */
  async getBookingsByBranch(branchId, filters = {}) {
    return this.getAllBookings({ ...filters, branchId });
  }

  /**
   * Get bookings by employee
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Array>} Array of booking documents
   */
  async getBookingsByEmployee(employeeId) {
    return await Booking.find({ employeeId })
      .populate('branchId', 'name branchNumber')
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
