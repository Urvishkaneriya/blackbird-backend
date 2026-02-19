const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');

router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   POST /api/products
 * @desc    Create product (admin-defined)
 * @access  Private (Admin only)
 */
router.post('/', productController.createProduct);

/**
 * @route   GET /api/products
 * @desc    Get products
 * @access  Private (Admin only)
 */
router.get('/', productController.getProducts);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put('/:id', productController.updateProduct);

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Update product active status
 * @access  Private (Admin only)
 */
router.patch('/:id/status', productController.updateStatus);

module.exports = router;
