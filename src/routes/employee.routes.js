const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   GET /api/employees/search
 * @desc    Search employees
 * @access  Private (Admin only)
 */
router.get('/search', employeeController.searchEmployees);

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin only)
 */
router.post('/', employeeController.createEmployee);

/**
 * @route   GET /api/employees
 * @desc    Get all employees
 * @access  Private (Admin only)
 */
router.get('/', employeeController.getAllEmployees);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private (Admin only)
 */
router.get('/:id', employeeController.getEmployeeById);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin only)
 */
router.put('/:id', employeeController.updateEmployee);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee
 * @access  Private (Admin only)
 */
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
