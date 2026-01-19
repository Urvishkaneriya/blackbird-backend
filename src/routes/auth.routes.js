const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login for admin and employee
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
