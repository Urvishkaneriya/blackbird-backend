const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// All routes require authentication (both admin and employee)
router.use(authenticateToken);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private (Admin and Employee)
 */
router.post('/', bookingController.createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get bookings (Admin: all, Employee: their branch)
 * @access  Private (Admin and Employee)
 */
router.get('/', bookingController.getBookings);

module.exports = router;
