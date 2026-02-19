const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard data for date range. Includes payment split and top products.
 * @access  Private (Admin or Employee)
 */
router.get('/', dashboardController.getDashboard);

module.exports = router;
