const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   POST /api/branches
 * @desc    Create new branch
 * @access  Private (Admin only)
 */
router.post('/', branchController.createBranch);

/**
 * @route   GET /api/branches
 * @desc    Get all branches
 * @access  Private (Admin only)
 */
router.get('/', branchController.getAllBranches);

/**
 * @route   PUT /api/branches/:id
 * @desc    Update branch
 * @access  Private (Admin only)
 */
router.put('/:id', branchController.updateBranch);

module.exports = router;
