const cron = require('node-cron');
const Booking = require('../models/booking.model');
const Product = require('../models/product.model');
const settingsService = require('../services/settings.service');
const whatsappService = require('../services/whatsapp.service');
const env = require('../config/env');

let reminderTask = null;

async function runReminderJob() {
  console.log('Reminder cron: running');
  try {
    const settings = await settingsService.getSettings();
    if (!settings.whatsappEnabled) return;
    if (!settings.reminderEnabled) {
      console.log('Reminder cron: reminders disabled in settings');
      return;
    }

    const days = settings.reminderTimeDays || 60;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const defaultProduct = await Product.findOne({ isDefault: true }).lean();
    if (!defaultProduct) {
      console.log('Reminder cron: default Tattoo product not found; skipping');
      return;
    }

    const bookings = await Booking.find({
      date: { $lte: cutoff },
      reminderSentAt: null,
      $or: [
        { 'items.productId': defaultProduct._id },
        { 'items.productName': defaultProduct.name },
      ],
    })
      .populate('userId', 'fullName phone')
      .populate('branchId', 'name branchNumber phoneNumber whatsappNumberId')
      .lean();

    for (const booking of bookings) {
      const phone = booking.phone || booking.userId?.phone;
      if (!phone) continue;

      const branchPhone = booking.branchId?.phoneNumber;
      if (!branchPhone) {
        console.warn(`Reminder cron: branch phone missing for booking ${booking._id}; skipping`);
        continue;
      }

      const daysPassed = Math.floor(
        (Date.now() - new Date(booking.date).getTime()) / (24 * 60 * 60 * 1000)
      );
      const phoneFormatted = phone.replace(/^\+?91/, '').replace(/\D/g, '');
      const toSend = phoneFormatted ? `+91${phoneFormatted}` : null;
      if (!toSend) continue;

      const whatsappConfig = {
        token: settings.wpToken || process.env.WHATSAPP_TOKEN,
        accountId: settings.wpAccountId || process.env.WHATSAPP_ACCOUNT_ID,
        numberId: booking?.branchId?.whatsappNumberId || process.env.TEST_NUM_ID,
      };
      const result = await whatsappService.sendReminderMessage(
        toSend,
        { daysPassed, branchPhone },
        whatsappConfig
      );
      if (result.success) {
        await Booking.findByIdAndUpdate(booking._id, { reminderSentAt: new Date() });
      }
    }

    if (bookings.length > 0) {
      console.log(`Reminder cron: processed ${bookings.length} booking(s)`);
    }
  } catch (error) {
    console.error('Reminder cron error:', error.message);
  }
}

function start() {
  if (reminderTask) return;

  reminderTask = cron.schedule(env.REMINDER_CRON_EXPRESSION, runReminderJob, {
    timezone: env.CRON_TIMEZONE,
  });
  console.log(`Reminder cron scheduled (${env.REMINDER_CRON_EXPRESSION}, ${env.CRON_TIMEZONE})`);
}

function stop() {
  if (!reminderTask) return;
  reminderTask.stop();
  reminderTask = null;
  console.log('Reminder cron stopped');
}

module.exports = { start, stop, runReminderJob };
