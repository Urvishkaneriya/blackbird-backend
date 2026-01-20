const Employee = require('../models/employee.model');
const branchService = require('./branch.service');
const { hashPassword } = require('../utils/passwordHash');

class EmployeeService {
  /**
   * Find employee by email
   * @param {String} email - Employee email
   * @returns {Promise<Object>} Employee document
   */
  async findByEmail(email) {
    return await Employee.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find employee by ID
   * @param {String} id - Employee ID
   * @returns {Promise<Object>} Employee document
   */
  async findById(id) {
    return await Employee.findById(id);
  }

  /**
   * Find employee by employee number
   * @param {String} employeeNumber - Employee number
   * @returns {Promise<Object>} Employee document
   */
  async findByEmployeeNumber(employeeNumber) {
    return await Employee.findOne({ employeeNumber });
  }

  /**
   * Find employee by unique ID
   * @param {String} uniqueId - Unique ID
   * @returns {Promise<Object>} Employee document
   */
  async findByUniqueId(uniqueId) {
    return await Employee.findOne({ uniqueId });
  }

  /**
   * Create new employee
   * @param {Object} employeeData - Employee data
   * @returns {Promise<Object>} Created employee document
   */
  async createEmployee(employeeData) {
    const { fullName, email, phoneNumber, password, branchId } = employeeData;

    // Check if employee already exists
    const existingEmployee = await this.findByEmail(email);
    if (existingEmployee) {
      throw new Error('Employee already exists with this email');
    }

    // Verify branch exists
    const branch = await branchService.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create employee
    const employee = new Employee({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      branchId,
    });

    const savedEmployee = await employee.save();

    // Increment branch employee count
    await branchService.incrementEmployeeCount(branchId);

    return savedEmployee;
  }

  /**
   * Get all employees
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of employee documents
   */
  async getAllEmployees(filters = {}) {
    return await Employee.find(filters).select('-password').sort({ createdAt: -1 });
  }

  /**
   * Update employee
   * @param {String} id - Employee ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated employee document
   */
  async updateEmployee(id, updateData) {
    // Get current employee data
    const currentEmployee = await this.findById(id);
    if (!currentEmployee) {
      throw new Error('Employee not found');
    }

    // Don't allow updating immutable fields
    delete updateData.uniqueId;
    delete updateData.employeeNumber;
    delete updateData.role;

    // Hash password if being updated
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Check if email already exists for another employee
    if (updateData.email) {
      const existingEmployee = await this.findByEmail(updateData.email);
      if (existingEmployee && existingEmployee._id.toString() !== id) {
        throw new Error('Email already in use by another employee');
      }
      updateData.email = updateData.email.toLowerCase();
    }

    // Handle branch change
    if (updateData.branchId && updateData.branchId !== currentEmployee.branchId.toString()) {
      // Verify new branch exists
      const newBranch = await branchService.findById(updateData.branchId);
      if (!newBranch) {
        throw new Error('Branch not found');
      }

      // Decrement old branch count
      await branchService.decrementEmployeeCount(currentEmployee.branchId);

      // Increment new branch count
      await branchService.incrementEmployeeCount(updateData.branchId);
    }

    return await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
  }

  /**
   * Delete employee
   * @param {String} id - Employee ID
   * @returns {Promise<Object>} Deleted employee document
   */
  async deleteEmployee(id) {
    // Get employee to access branchId
    const employee = await this.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Delete employee
    const deletedEmployee = await Employee.findByIdAndDelete(id);

    // Decrement branch employee count
    if (deletedEmployee) {
      await branchService.decrementEmployeeCount(employee.branchId);
    }

    return deletedEmployee;
  }

  /**
   * Count employees
   * @returns {Promise<Number>} Number of employees
   */
  async countEmployees() {
    return await Employee.countDocuments();
  }

  /**
   * Search employees
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching employee documents
   */
  async searchEmployees(searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');
    return await Employee.find({
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { employeeNumber: searchRegex },
        { phoneNumber: searchRegex },
      ],
    }).select('-password');
  }
}

module.exports = new EmployeeService();
