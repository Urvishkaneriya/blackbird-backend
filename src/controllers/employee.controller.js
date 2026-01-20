const employeeService = require('../services/employee.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  conflictResponse,
} = require('../utils/response');
const { MESSAGES } = require('../config/constants');

class EmployeeController {
  /**
   * Create new employee
   * POST /api/employees
   */
  async createEmployee(req, res, next) {
    try {
      const { fullName, email, phoneNumber, password, branchId } = req.body;

      // Validation
      if (!fullName || !email || !phoneNumber || !password || !branchId) {
        return badRequestResponse(res, 'All fields are required (fullName, email, phoneNumber, password, branchId)');
      }

      // Create employee
      const employee = await employeeService.createEmployee({
        fullName,
        email,
        phoneNumber,
        password,
        branchId,
      });

      return createdResponse(res, MESSAGES.EMPLOYEE_CREATED, employee);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return conflictResponse(res, MESSAGES.EMPLOYEE_ALREADY_EXISTS);
      }
      if (error.message === 'Branch not found') {
        return notFoundResponse(res, 'Branch not found');
      }
      next(error);
    }
  }

  /**
   * Get all employees
   * GET /api/employees
   */
  async getAllEmployees(req, res, next) {
    try {
      const employees = await employeeService.getAllEmployees();

      return successResponse(res, MESSAGES.EMPLOYEES_FETCHED, {
        count: employees.length,
        employees,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee by ID
   * GET /api/employees/:id
   */
  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;

      const employee = await employeeService.findById(id);

      if (!employee) {
        return notFoundResponse(res, MESSAGES.EMPLOYEE_NOT_FOUND);
      }

      return successResponse(res, MESSAGES.EMPLOYEE_FETCHED, employee);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update employee
   * PUT /api/employees/:id
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if employee exists
      const existingEmployee = await employeeService.findById(id);
      if (!existingEmployee) {
        return notFoundResponse(res, MESSAGES.EMPLOYEE_NOT_FOUND);
      }

      // Update employee
      const updatedEmployee = await employeeService.updateEmployee(id, updateData);

      return successResponse(res, MESSAGES.EMPLOYEE_UPDATED, updatedEmployee);
    } catch (error) {
      if (error.message.includes('already in use')) {
        return conflictResponse(res, 'Email already in use by another employee');
      }
      next(error);
    }
  }

  /**
   * Delete employee
   * DELETE /api/employees/:id
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;

      // Check if employee exists
      const employee = await employeeService.findById(id);
      if (!employee) {
        return notFoundResponse(res, MESSAGES.EMPLOYEE_NOT_FOUND);
      }

      // Delete employee
      await employeeService.deleteEmployee(id);

      return successResponse(res, MESSAGES.EMPLOYEE_DELETED, {
        deletedEmployee: {
          id: employee._id,
          fullName: employee.fullName,
          email: employee.email,
          employeeNumber: employee.employeeNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search employees
   * GET /api/employees/search?q=searchTerm
   */
  async searchEmployees(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return badRequestResponse(res, 'Search term is required');
      }

      const employees = await employeeService.searchEmployees(q);

      return successResponse(res, MESSAGES.EMPLOYEES_FETCHED, {
        count: employees.length,
        employees,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
