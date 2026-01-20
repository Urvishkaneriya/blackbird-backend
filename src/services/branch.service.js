const Branch = require('../models/branch.model');

class BranchService {
  /**
   * Create new branch
   * @param {Object} branchData - Branch data (name, address)
   * @returns {Promise<Object>} Created branch document
   */
  async createBranch(branchData) {
    const { name, address } = branchData;

    // Create branch
    const branch = new Branch({
      name,
      address,
      employeeCount: 0,
    });

    return await branch.save();
  }

  /**
   * Get all branches
   * @returns {Promise<Array>} Array of branch documents
   */
  async getAllBranches() {
    return await Branch.find().sort({ createdAt: -1 });
  }

  /**
   * Find branch by ID
   * @param {String} id - Branch ID
   * @returns {Promise<Object>} Branch document
   */
  async findById(id) {
    return await Branch.findById(id);
  }

  /**
   * Find branch by branch number
   * @param {String} branchNumber - Branch number
   * @returns {Promise<Object>} Branch document
   */
  async findByBranchNumber(branchNumber) {
    return await Branch.findOne({ branchNumber });
  }

  /**
   * Update branch
   * @param {String} id - Branch ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated branch document
   */
  async updateBranch(id, updateData) {
    // Don't allow updating immutable fields
    delete updateData.branchNumber;
    delete updateData.employeeCount;

    return await Branch.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Increment employee count
   * @param {String} branchId - Branch ID
   * @returns {Promise<Object>} Updated branch
   */
  async incrementEmployeeCount(branchId) {
    return await Branch.findByIdAndUpdate(
      branchId,
      { $inc: { employeeCount: 1 } },
      { new: true }
    );
  }

  /**
   * Decrement employee count
   * @param {String} branchId - Branch ID
   * @returns {Promise<Object>} Updated branch
   */
  async decrementEmployeeCount(branchId) {
    return await Branch.findByIdAndUpdate(
      branchId,
      { $inc: { employeeCount: -1 } },
      { new: true }
    );
  }

  /**
   * Get branch with employee count
   * @param {String} id - Branch ID
   * @returns {Promise<Object>} Branch with employee details
   */
  async getBranchWithEmployees(id) {
    return await Branch.findById(id);
  }

  /**
   * Count branches
   * @returns {Promise<Number>} Number of branches
   */
  async countBranches() {
    return await Branch.countDocuments();
  }
}

module.exports = new BranchService();
