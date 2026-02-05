const express = require('express');
const router = express.Router();
const marketingTemplateController = require('../controllers/marketingTemplate.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');

router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   POST /api/marketing/templates
 * @desc    Create marketing template (admin only)
 * @access  Private (Admin only)
 */
router.post('/templates', marketingTemplateController.createTemplate);

/**
 * @route   GET /api/marketing/templates
 * @desc    Get all templates (admin only)
 * @access  Private (Admin only)
 */
router.get('/templates', marketingTemplateController.getTemplates);

/**
 * @route   GET /api/marketing/templates/:id
 * @desc    Get template by ID (admin only)
 * @access  Private (Admin only)
 */
router.get('/templates/:id', marketingTemplateController.getTemplateById);

/**
 * @route   PUT /api/marketing/templates/:id
 * @desc    Update template (admin only)
 * @access  Private (Admin only)
 */
router.put('/templates/:id', marketingTemplateController.updateTemplate);

/**
 * @route   DELETE /api/marketing/templates/:id
 * @desc    Delete template (admin only)
 * @access  Private (Admin only)
 */
router.delete('/templates/:id', marketingTemplateController.deleteTemplate);

/**
 * @route   POST /api/marketing/templates/:id/preview
 * @desc    Preview template with parameters (admin only)
 * @access  Private (Admin only)
 */
router.post('/templates/:id/preview', marketingTemplateController.previewTemplate);

/**
 * @route   POST /api/marketing/templates/:id/send
 * @desc    Send marketing message using template (admin only)
 * @access  Private (Admin only)
 */
router.post('/templates/:id/send', marketingTemplateController.sendMarketingMessage);

/**
 * @route   GET /api/marketing/sends
 * @desc    Get all send jobs (admin only)
 * @access  Private (Admin only)
 */
router.get('/sends', marketingTemplateController.getSendJobs);

/**
 * @route   GET /api/marketing/sends/:id
 * @desc    Get send job by ID (admin only)
 * @access  Private (Admin only)
 */
router.get('/sends/:id', marketingTemplateController.getSendJob);

/**
 * @route   GET /api/marketing/dynamic-fields
 * @desc    Get available dynamic field enum options (for frontend dropdown)
 * @access  Private (Admin only)
 */
router.get('/dynamic-fields', marketingTemplateController.getDynamicFields);

module.exports = router;
