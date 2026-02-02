const User = require('../models/user.model');
const mongoose = require('mongoose');
const Booking = require('../models/booking.model');

class UserService {
  /**
   * Find user by phone
   * @param {String} phone - User phone number
   * @returns {Promise<Object>} User document
   */
  async findByPhone(phone) {
    return await User.findOne({ phone });
  }

  /**
   * Find user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object>} User document
   */
  async findById(id) {
    return await User.findById(id);
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user document
   */
  async createUser(userData) {
    const { fullName, phone, email } = userData;

    const user = new User({
      fullName,
      phone,
      email,
      totalOrders: 0,
      totalAmount: 0,
    });

    return await user.save();
  }

  /**
   * Update user statistics (orders and amount)
   * @param {String} userId - User ID
   * @param {Number} amount - Amount to add
   * @returns {Promise<Object>} Updated user document
   */
  async updateUserStats(userId, amount) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalOrders: 1,
          totalAmount: amount,
        },
      },
      { new: true }
    );
  }

  /**
   * Update user email
   * @param {String} userId - User ID
   * @param {String} email - New email
   * @returns {Promise<Object>} Updated user document
   */
  async updateUserEmail(userId, email) {
    return await User.findByIdAndUpdate(userId, { email }, { new: true });
  }

  /**
   * Get all users (optionally filtered by branchId = users with booking at that branch), with pagination
   * @param {Object} filters - { branchId?, page?, limit? }
   * @returns {Promise<{ users: Array, total: Number }>}
   */
  async getUsers(filters = {}) {
    const { branchId, page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    let query = {};
    if (branchId) {
      const userIds = await Booking.distinct('userId', { branchId: new mongoose.Types.ObjectId(branchId) });
      query = { _id: { $in: userIds } };
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      User.countDocuments(query),
    ]);
    return { users, total };
  }

  /**
   * Get all users (no filter) - backward compat
   * @returns {Promise<Array>} Array of user documents
   */
  async getAllUsers() {
    return await User.find().sort({ createdAt: -1 });
  }

  /**
   * Count users
   * @returns {Promise<Number>} Number of users
   */
  async countUsers() {
    return await User.countDocuments();
  }
}

module.exports = new UserService();
