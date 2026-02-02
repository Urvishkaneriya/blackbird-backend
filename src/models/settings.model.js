const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Single document - use a fixed _id or findOne
    whatsappEnabled: {
      type: Boolean,
      default: true,
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    reminderTimeDays: {
      type: Number,
      default: 60,
      min: [1, 'Reminder time must be at least 1 day'],
    },
    selfInvoiceMessageEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
