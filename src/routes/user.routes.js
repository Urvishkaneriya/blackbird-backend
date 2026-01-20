const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   GET /api/users
 * @desc    Get all users (customers)
 * @access  Private (Admin only)
 */
router.get('/', userController.getAllUsers);

module.exports = router;
