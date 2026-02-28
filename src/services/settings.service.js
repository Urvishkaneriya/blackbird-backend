const Settings = require('../models/settings.model');

const DEFAULT_SETTINGS = {
  whatsappEnabled: true,
  reminderEnabled: true,
  reminderTimeDays: 60,
  selfInvoiceMessageEnabled: true,
  wpToken: '',
  wpAccountId: '',
  selfSendNumber: '',
  wpMediaId: '',
};

/**
 * Get current settings (single document)
 * @returns {Promise<Object>} Settings document
 */
async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(DEFAULT_SETTINGS);
    return settings;
  }

  let changed = false;
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (settings[key] === undefined) {
      settings[key] = value;
      changed = true;
    }
  }
  if (changed) {
    await settings.save();
  }
  return settings;
}

/**
 * Update settings (admin only)
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated settings
 */
async function updateSettings(updateData) {
  const payload = {};
  if (updateData.whatsappEnabled !== undefined) payload.whatsappEnabled = Boolean(updateData.whatsappEnabled);
  if (updateData.reminderEnabled !== undefined) payload.reminderEnabled = Boolean(updateData.reminderEnabled);
  if (updateData.reminderTimeDays !== undefined) {
    const days = Number(updateData.reminderTimeDays);
    if (days < 1) throw new Error('reminderTimeDays must be at least 1');
    payload.reminderTimeDays = days;
  }
  if (updateData.selfInvoiceMessageEnabled !== undefined) payload.selfInvoiceMessageEnabled = Boolean(updateData.selfInvoiceMessageEnabled);
  if (updateData.wpToken !== undefined) payload.wpToken = String(updateData.wpToken || '').trim();
  if (updateData.wpAccountId !== undefined) payload.wpAccountId = String(updateData.wpAccountId || '').trim();
  if (updateData.selfSendNumber !== undefined) {
    payload.selfSendNumber = String(updateData.selfSendNumber || '').replace(/\D/g, '');
  }
  if (updateData.wpMediaId !== undefined) payload.wpMediaId = String(updateData.wpMediaId || '').trim();

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ ...DEFAULT_SETTINGS, ...payload });
  } else {
    settings = await Settings.findByIdAndUpdate(settings._id, payload, { new: true, runValidators: true });
  }
  return settings;
}

/**
 * Seed default settings if none exist (called on startup)
 */
async function seedSettings() {
  const existing = await Settings.findOne();
  if (!existing) {
    await Settings.create(DEFAULT_SETTINGS);
    console.log('📋 Default settings created');
  }
}

module.exports = {
  getSettings,
  updateSettings,
  seedSettings,
  DEFAULT_SETTINGS,
};
