const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// All routes require authentication (admin and employee)
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users (customers)
 * @access  Private (Admin and Employee)
 */
router.get('/', userController.getAllUsers);

module.exports = router;
