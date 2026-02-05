const MarketingTemplate = require('../models/marketingTemplate.model');

class MarketingTemplateService {
  /**
   * Create new marketing template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData) {
    const { name, displayName, channel, whatsappTemplateName, languageCode, bodyExample, parameters, createdBy } = templateData;

    // Validate parameters: positions must be contiguous starting from 1
    if (parameters && parameters.length > 0) {
      const positions = parameters.map((p) => p.position).sort((a, b) => a - b);
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== i + 1) {
          throw new Error(`Parameter positions must be contiguous starting from 1. Found gap at position ${i + 1}`);
        }
      }
    }

    const template = new MarketingTemplate({
      name: name.toUpperCase(),
      displayName,
      channel: channel || 'whatsapp',
      whatsappTemplateName,
      languageCode: languageCode || 'en',
      bodyExample: bodyExample || '',
      parameters: parameters || [],
      isActive: true,
      createdBy,
    });

    return await template.save();
  }

  /**
   * Get all templates with filters and pagination
   * @param {Object} filters - { channel?, isActive?, page?, limit? }
   * @returns {Promise<{ templates: Array, total: Number }>}
   */
  async getTemplates(filters = {}) {
    const { channel, isActive, page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const query = {};
    if (channel) query.channel = channel;
    if (isActive !== undefined) query.isActive = isActive;

    const [templates, total] = await Promise.all([
      MarketingTemplate.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      MarketingTemplate.countDocuments(query),
    ]);

    return { templates, total };
  }

  /**
   * Get template by ID
   * @param {String} id - Template ID
   * @returns {Promise<Object>} Template document
   */
  async findById(id) {
    return await MarketingTemplate.findById(id).populate('createdBy', 'name email');
  }

  /**
   * Update template
   * @param {String} id - Template ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(id, updateData) {
    // Validate parameters if being updated
    if (updateData.parameters && updateData.parameters.length > 0) {
      const positions = updateData.parameters.map((p) => p.position).sort((a, b) => a - b);
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== i + 1) {
          throw new Error(`Parameter positions must be contiguous starting from 1. Found gap at position ${i + 1}`);
        }
      }
    }

    if (updateData.name) {
      updateData.name = updateData.name.toUpperCase();
    }

    return await MarketingTemplate.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  /**
   * Delete template
   * @param {String} id - Template ID
   * @returns {Promise<Object>} Deleted template
   */
  async deleteTemplate(id) {
    return await MarketingTemplate.findByIdAndDelete(id);
  }
}

module.exports = new MarketingTemplateService();
