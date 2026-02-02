const cron = require('node-cron');
const Booking = require('../models/booking.model');
const settingsService = require('../services/settings.service');
const whatsappService = require('../services/whatsapp.service');

/**
 * Run reminder job: find bookings that are >= reminderTimeDays old and haven't had reminder sent,
 * send WhatsApp reminder, then set reminderSentAt.
 */
async function runReminderJob() {
  try {
    const settings = await settingsService.getSettings();
    if (!settings.whatsappEnabled) {
      return;
    }
    if (!settings.reminderEnabled) {
      console.log('⏰ Reminder cron: reminders disabled in settings');
      return;
    }

    const days = settings.reminderTimeDays || 60;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      date: { $lte: cutoff },
      reminderSentAt: null,
    })
      .populate('userId', 'fullName phone')
      .lean();

    for (const b of bookings) {
      const phone = b.phone || b.userId?.phone;
      if (!phone) continue;
      const fullName = b.fullName || b.userId?.fullName || 'Customer';
      const daysPassed = Math.floor((Date.now() - new Date(b.date).getTime()) / (24 * 60 * 60 * 1000));
      const phoneFormatted = phone.replace(/^\+?91/, '').replace(/\D/g, '');
      const toSend = phoneFormatted ? `+91${phoneFormatted}` : null;
      if (!toSend) continue;

      const result = await whatsappService.sendReminderMessage(toSend, { fullName, daysPassed });

      if (result.success) {
        await Booking.findByIdAndUpdate(b._id, { reminderSentAt: new Date() });
      }
    }
    if (bookings.length > 0) {
      console.log(`⏰ Reminder cron: processed ${bookings.length} booking(s)`);
    }
  } catch (err) {
    console.error('⏰ Reminder cron error:', err.message);
  }
}

function start() {
  // Every 12 hours: at 00:00 and 12:00
  cron.schedule('0 */12 * * *', runReminderJob, { timezone: 'Asia/Kolkata' });
  console.log('⏰ Reminder cron scheduled (every 12 hours)');
}

module.exports = { start, runReminderJob };
