const Admin = require('../models/admin.model');
const { hashPassword } = require('../utils/passwordHash');

class AdminService {
  /**
   * Find admin by email
   * @param {String} email - Admin email
   * @returns {Promise<Object>} Admin document
   */
  async findByEmail(email) {
    return await Admin.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find admin by ID
   * @param {String} id - Admin ID
   * @returns {Promise<Object>} Admin document
   */
  async findById(id) {
    return await Admin.findById(id);
  }

  /**
   * Create new admin
   * @param {Object} adminData - Admin data (name, email, password)
   * @returns {Promise<Object>} Created admin document
   */
  async createAdmin(adminData) {
    const { name, email, password } = adminData;

    // Check if admin already exists
    const existingAdmin = await this.findByEmail(email);
    if (existingAdmin) {
      throw new Error('Admin already exists with this email');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin
    const admin = new Admin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return await admin.save();
  }

  /**
   * Get all admins
   * @returns {Promise<Array>} Array of admin documents
   */
  async getAllAdmins() {
    return await Admin.find().select('-password');
  }

  /**
   * Count admins
   * @returns {Promise<Number>} Number of admins
   */
  async countAdmins() {
    return await Admin.countDocuments();
  }

  /**
   * Update admin
   * @param {String} id - Admin ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated admin document
   */
  async updateAdmin(id, updateData) {
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    return await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
  }

  /**
   * Delete admin
   * @param {String} id - Admin ID
   * @returns {Promise<Object>} Deleted admin document
   */
  async deleteAdmin(id) {
    return await Admin.findByIdAndDelete(id);
  }
}

module.exports = new AdminService();
