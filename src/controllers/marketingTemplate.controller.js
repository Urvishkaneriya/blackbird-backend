const marketingTemplateService = require('../services/marketingTemplate.service');
const marketingSendService = require('../services/marketingSend.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
} = require('../utils/response');
const { MESSAGES, MARKETING_DYNAMIC_FIELDS } = require('../config/constants');

/**
 * Create marketing template
 * POST /api/marketing/templates
 */
async function createTemplate(req, res, next) {
  try {
    const { name, displayName, channel, whatsappTemplateName, languageCode, bodyExample, parameters } = req.body;

    if (!name || !displayName || !whatsappTemplateName) {
      return badRequestResponse(res, 'name, displayName, and whatsappTemplateName are required');
    }

    const template = await marketingTemplateService.createTemplate({
      name,
      displayName,
      channel,
      whatsappTemplateName,
      languageCode,
      bodyExample,
      parameters,
      createdBy: req.user.id,
    });

    return createdResponse(res, 'Marketing template created successfully', template);
  } catch (error) {
    if (error.message.includes('contiguous') || error.message.includes('duplicate')) {
      return badRequestResponse(res, error.message);
    }
    next(error);
  }
}

/**
 * Get all templates
 * GET /api/marketing/templates?channel=&isActive=&page=&limit=
 */
async function getTemplates(req, res, next) {
  try {
    const { channel, isActive, page, limit } = req.query;
    const { templates, total } = await marketingTemplateService.getTemplates({
      channel,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(1, parseInt(page, 10) || 1);

    return successResponse(res, 'Templates fetched successfully', {
      count: templates.length,
      total,
      page: safePage,
      limit: safeLimit,
      templates,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get template by ID
 * GET /api/marketing/templates/:id
 */
async function getTemplateById(req, res, next) {
  try {
    const { id } = req.params;
    const template = await marketingTemplateService.findById(id);

    if (!template) {
      return notFoundResponse(res, 'Template not found');
    }

    return successResponse(res, 'Template fetched successfully', template);
  } catch (error) {
    next(error);
  }
}

/**
 * Update template
 * PUT /api/marketing/templates/:id
 */
async function updateTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await marketingTemplateService.findById(id);
    if (!template) {
      return notFoundResponse(res, 'Template not found');
    }

    const updated = await marketingTemplateService.updateTemplate(id, updateData);
    return successResponse(res, 'Template updated successfully', updated);
  } catch (error) {
    if (error.message.includes('contiguous')) {
      return badRequestResponse(res, error.message);
    }
    next(error);
  }
}

/**
 * Delete template
 * DELETE /api/marketing/templates/:id
 */
async function deleteTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await marketingTemplateService.findById(id);

    if (!template) {
      return notFoundResponse(res, 'Template not found');
    }

    await marketingTemplateService.deleteTemplate(id);
    return successResponse(res, 'Template deleted successfully', {
      deletedTemplate: {
        id: template._id,
        name: template.name,
        displayName: template.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Preview template with parameters
 * POST /api/marketing/templates/:id/preview
 */
async function previewTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const { parameters } = req.body;

    if (!parameters || typeof parameters !== 'object') {
      return badRequestResponse(res, 'parameters object is required');
    }

    const preview = await marketingSendService.previewTemplate(id, parameters);
    return successResponse(res, 'Preview generated successfully', preview);
  } catch (error) {
    if (error.message === 'Template not found') {
      return notFoundResponse(res, error.message);
    }
    next(error);
  }
}

/**
 * Send marketing message
 * POST /api/marketing/templates/:id/send
 */
async function sendMarketingMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { audience, parameters } = req.body;

    if (!audience || !audience.type) {
      return badRequestResponse(res, 'audience.type is required');
    }
    if (!parameters || typeof parameters !== 'object') {
      return badRequestResponse(res, 'parameters object is required');
    }

    // Validate audience types
    if (audience.type === 'single' && !audience.phone) {
      return badRequestResponse(res, 'audience.phone is required for single type');
    }
    if (audience.type === 'list' && (!audience.phones || !Array.isArray(audience.phones))) {
      return badRequestResponse(res, 'audience.phones array is required for list type');
    }
    if (audience.type === 'branch_customers' && !audience.branchId) {
      return badRequestResponse(res, 'audience.branchId is required for branch_customers type');
    }

    const sendJob = await marketingSendService.sendMarketingMessage(
      id,
      audience,
      parameters,
      null, // perUserParameters deprecated - now using source: "user" in template
      req.user.id
    );

    return successResponse(res, 'Marketing send started', sendJob);
  } catch (error) {
    if (error.message === 'Template not found' || error.message === 'Template is not active') {
      return badRequestResponse(res, error.message);
    }
    if (error.message === 'WhatsApp is disabled') {
      return badRequestResponse(res, error.message);
    }
    next(error);
  }
}

/**
 * Get send job by ID
 * GET /api/marketing/sends/:id
 */
async function getSendJob(req, res, next) {
  try {
    const { id } = req.params;
    const sendJob = await marketingSendService.findById(id);

    if (!sendJob) {
      return notFoundResponse(res, 'Send job not found');
    }

    return successResponse(res, 'Send job fetched successfully', sendJob);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all send jobs
 * GET /api/marketing/sends?page=&limit=
 */
async function getSendJobs(req, res, next) {
  try {
    const { page, limit } = req.query;
    const { sends, total } = await marketingSendService.getSendJobs({ page, limit });

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(1, parseInt(page, 10) || 1);

    return successResponse(res, 'Send jobs fetched successfully', {
      count: sends.length,
      total,
      page: safePage,
      limit: safeLimit,
      sends,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available dynamic field options (for frontend dropdown)
 * GET /api/marketing/dynamic-fields
 */
async function getDynamicFields(req, res, next) {
  try {
    const fields = Object.values(MARKETING_DYNAMIC_FIELDS).map((value) => ({
      value,
      label: value.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim(),
    }));
    return successResponse(res, 'Dynamic fields fetched successfully', { fields });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  sendMarketingMessage,
  getSendJob,
  getSendJobs,
  getDynamicFields,
};
