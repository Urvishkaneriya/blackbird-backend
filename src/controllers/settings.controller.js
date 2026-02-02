const settingsService = require('../services/settings.service');
const { successResponse, badRequestResponse } = require('../utils/response');
const { MESSAGES } = require('../config/constants');

/**
 * GET /api/settings - Get current settings (admin only)
 */
async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    return successResponse(res, 'Settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/settings - Update settings (admin only)
 * Body: { whatsappEnabled?, reminderEnabled?, reminderTimeDays?, selfInvoiceMessageEnabled? }
 */
async function updateSettings(req, res, next) {
  try {
    const updateData = req.body || {};
    if (updateData.reminderTimeDays !== undefined && (Number(updateData.reminderTimeDays) < 1 || isNaN(Number(updateData.reminderTimeDays)))) {
      return badRequestResponse(res, 'reminderTimeDays must be at least 1');
    }
    const settings = await settingsService.updateSettings(updateData);
    return successResponse(res, 'Settings updated successfully', settings);
  } catch (error) {
    if (error.message && error.message.includes('at least 1')) {
      return badRequestResponse(res, error.message);
    }
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
};
