const mongoose = require('mongoose');
const MarketingSend = require('../models/marketingSend.model');
const MarketingTemplate = require('../models/marketingTemplate.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Branch = require('../models/branch.model');
const whatsappService = require('./whatsapp.service');
const settingsService = require('./settings.service');
const { MARKETING_FIELD_MAPPING } = require('../config/constants');

class MarketingSendService {
  /**
   * Resolve dynamic field enum value to actual database value
   * @param {String} enumValue - Enum value like "user_fullName", "branch_name"
   * @param {Object} user - User document
   * @param {Object} branch - Branch document
   * @returns {String} Resolved value or empty string
   */
  resolveDynamicField(enumValue, user = null, branch = null) {
    if (!enumValue || typeof enumValue !== 'string') return '';

    const mapping = MARKETING_FIELD_MAPPING[enumValue];
    if (!mapping) return ''; // Not a dynamic field, return as-is

    if (mapping.type === 'user' && user) {
      return user[mapping.field] || '';
    }
    if (mapping.type === 'branch' && branch) {
      return branch[mapping.field] || '';
    }

    return '';
  }

  /**
   * Build ordered parameter array from template and user-provided parameters
   * @param {Object} template - Template document with parameters array
   * @param {Object} userParams - Parameters provided by admin (can be static values or enum strings)
   * @param {Object} user - User document (for resolving enum values)
   * @param {Object} branch - Branch document (for resolving enum values)
   * @returns {Array} Ordered array of parameter values
   */
  buildOrderedParameters(template, userParams, user = null, branch = null) {
    const ordered = [];
    const sortedParams = [...template.parameters].sort((a, b) => a.position - b.position);

    for (const param of sortedParams) {
      let value = userParams[param.key];

      // Check if value is a dynamic field enum (like "user_fullName")
      if (value && typeof value === 'string' && MARKETING_FIELD_MAPPING[value]) {
        value = this.resolveDynamicField(value, user, branch);
      }

      // Convert to string for WhatsApp
      if (value === null || value === undefined) {
        value = '';
      } else if (param.type === 'number') {
        value = String(Number(value));
      } else {
        value = String(value);
      }

      ordered.push(value);
    }

    return ordered;
  }

  /**
   * Preview template with parameters (no send)
   * @param {String} templateId - Template ID
   * @param {Object} parameters - Parameter values
   * @returns {Promise<Object>} Preview data
   */
  async previewTemplate(templateId, parameters) {
    const template = await MarketingTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const orderedParams = this.buildOrderedParameters(template, parameters);

    // Build rendered text example (replace {{n}} with values)
    let renderedText = template.bodyExample || '';
    template.parameters.forEach((param, idx) => {
      renderedText = renderedText.replace(new RegExp(`\\{\\{${param.position}\\}\\}`, 'g'), orderedParams[idx] || '');
    });

    return {
      renderedText,
      whatsappTemplateName: template.whatsappTemplateName,
      languageCode: template.languageCode,
      mappedParameters: orderedParams,
    };
  }

  /**
   * Get audience phones based on audience type and filters
   * @param {Object} audience - Audience config
   * @returns {Promise<Array>} Array of { phone, user?, branch? } objects
   */
  async getAudiencePhones(audience) {
    const { type, phone, phones, branchId, dateFilter } = audience;

    if (type === 'single') {
      // Try to find user by phone for dynamic field resolution
      const user = await User.findOne({ phone }).lean();
      let branch = null;
      if (branchId) {
        branch = await Branch.findById(branchId).lean();
      }
      return [{ phone, user, branch }];
    }

    if (type === 'list') {
      return phones.map((p) => ({ phone: p }));
    }

    // For branch_customers and all_customers, query bookings
    const bookingQuery = {};
    if (type === 'branch_customers' && branchId) {
      bookingQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (dateFilter && (dateFilter.startDate || dateFilter.endDate)) {
      bookingQuery.date = {};
      if (dateFilter.startDate) {
        const start = new Date(dateFilter.startDate);
        start.setHours(0, 0, 0, 0);
        bookingQuery.date.$gte = start;
      }
      if (dateFilter.endDate) {
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        bookingQuery.date.$lte = end;
      }
    }

    const userIds = await Booking.distinct('userId', bookingQuery);
    const users = await User.find({ _id: { $in: userIds } }).lean();

    // Get branch info if branchId provided
    let branch = null;
    if (branchId) {
      branch = await Branch.findById(branchId).lean();
    }

    return users.map((u) => ({ phone: u.phone, user: u, branch }));
  }

  /**
   * Send marketing message
   * @param {String} templateId - Template ID
   * @param {Object} audience - Audience config
   * @param {Object} parameters - Static parameters (admin-provided)
   * @param {Object} perUserParameters - Deprecated (kept for backward compat, not used)
   * @param {String} triggeredBy - Admin ID
   * @returns {Promise<Object>} Send job document
   */
  async sendMarketingMessage(templateId, audience, parameters, perUserParameters, triggeredBy) {
    const template = await MarketingTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    if (!template.isActive) {
      throw new Error('Template is not active');
    }

    // Check WhatsApp is enabled
    const settings = await settingsService.getSettings();
    if (!settings.whatsappEnabled) {
      throw new Error('WhatsApp is disabled in settings');
    }

    // Validate required parameters
    const requiredParams = template.parameters.filter((p) => p.required === true);
    for (const param of requiredParams) {
      if (!(param.key in parameters)) {
        throw new Error(`Required parameter '${param.key}' is missing`);
      }
    }

    // Create send job
    const sendJob = new MarketingSend({
      templateId,
      triggeredBy,
      audienceType: audience.type,
      audienceFilter: audience,
      parameters,
      perUserParameters: {}, // Deprecated - now using source: "user" in template
      status: 'pending',
    });
    await sendJob.save();

    // Get audience phones
    const audiencePhones = await this.getAudiencePhones(audience);
    sendJob.stats.total = audiencePhones.length;
    sendJob.status = 'running';
    await sendJob.save();

    // Send to each phone (async, don't await all)
    let successCount = 0;
    let failCount = 0;

    for (const item of audiencePhones) {
      try {
        // Build parameters - resolve enum values (like "user_fullName") from database
        const orderedParams = this.buildOrderedParameters(template, parameters, item.user, item.branch);

        // Send via WhatsApp
        const phoneFormatted = item.phone.replace(/^\+?91/, '').replace(/\D/g, '');
        const toSend = phoneFormatted ? `+91${phoneFormatted}` : null;

        if (toSend) {
          const result = await whatsappService.sendMarketingMessage(
            toSend,
            template.whatsappTemplateName,
            template.languageCode,
            orderedParams
          );

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to send to ${item.phone}:`, error.message);
        failCount++;
      }
    }

    // Update send job
    sendJob.stats.success = successCount;
    sendJob.stats.failed = failCount;
    sendJob.status = failCount === 0 ? 'completed' : failCount === sendJob.stats.total ? 'failed' : 'partial';
    sendJob.completedAt = new Date();
    await sendJob.save();

    return sendJob;
  }

  /**
   * Get send job by ID
   * @param {String} id - Send job ID
   * @returns {Promise<Object>} Send job document
   */
  async findById(id) {
    return await MarketingSend.findById(id)
      .populate('templateId', 'name displayName whatsappTemplateName')
      .populate('triggeredBy', 'name email');
  }

  /**
   * Get all send jobs with pagination
   * @param {Object} filters - { page?, limit? }
   * @returns {Promise<{ sends: Array, total: Number }>}
   */
  async getSendJobs(filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const [sends, total] = await Promise.all([
      MarketingSend.find()
        .populate('templateId', 'name displayName')
        .populate('triggeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      MarketingSend.countDocuments(),
    ]);

    return { sends, total };
  }
}

module.exports = new MarketingSendService();
