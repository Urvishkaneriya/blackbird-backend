const axios = require('axios');
const { getBlackbirdInvoicePayload, getBlackbirdCheckupReminderPayload } = require('../utils/whatsappTemplates');

class WhatsAppService {
  /**
   * Send invoice message via WhatsApp using blackbird_invoice template
   * @param {String} phone - Customer phone number
   * @param {Object} bookingData - Booking data with populated branch
   * @returns {Promise<Object>} API response
   */
  async sendInvoiceMessage(phone, bookingData) {
    try {
      // Validate required config (enable/disable is controlled by DB settings)
      if (!process.env.WHATSAPP_TOKEN || !process.env.TEST_NUM_ID) {
        console.error('❌ WhatsApp configuration missing');
        return { success: false, message: 'WhatsApp configuration missing' };
      }

      // Format phone number (remove spaces, +, special chars, keep only digits)
      const formattedPhone = phone.replace(/\D/g, '');

      // Build template payload using utility
      const template = getBlackbirdInvoicePayload(bookingData);

      // Meta WhatsApp Business API endpoint
      const apiUrl = `https://graph.facebook.com/v18.0/${process.env.TEST_NUM_ID}/messages`;

      // Request payload - template message
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template,
      };

      // Send message
      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('✅ WhatsApp message sent successfully:', response.data);
      return { success: true, data: response.data };

    } catch (error) {
      // Log error but don't throw - booking should still succeed
      console.error('❌ WhatsApp message failed:', {
        message: error.message,
        response: error.response?.data,
        phone: phone,
      });
      return {
        success: false,
        message: error.message,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Send checkup reminder via WhatsApp using blackbird_checkup_reminder template
   * @param {String} phone - Customer phone number
   * @param {Object} data - { fullName, daysPassed }
   * @returns {Promise<Object>} API response
   */
  async sendReminderMessage(phone, data) {
    try {
      if (!process.env.WHATSAPP_TOKEN || !process.env.TEST_NUM_ID) {
        return { success: false, message: 'WhatsApp configuration missing' };
      }
      const formattedPhone = phone.replace(/\D/g, '');
      const template = getBlackbirdCheckupReminderPayload(data.fullName, data.daysPassed);
      const apiUrl = `https://graph.facebook.com/v18.0/${process.env.TEST_NUM_ID}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template,
      };
      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      console.log('✅ WhatsApp reminder sent:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ WhatsApp reminder failed:', { message: error.message, phone });
      return { success: false, message: error.message };
    }
  }

  /**
   * Format phone number for WhatsApp API
   * @param {String} phone - Phone number
   * @returns {String} Formatted phone number
   */
  formatPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
  }
}

module.exports = new WhatsAppService();
