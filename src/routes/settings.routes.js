const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');

router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   GET /api/settings
 * @desc    Get app settings (admin only)
 * @access  Private (Admin only)
 */
router.get('/', settingsController.getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update settings (admin only)
 * @access  Private (Admin only)
 */
router.put('/', settingsController.updateSettings);

module.exports = router;
