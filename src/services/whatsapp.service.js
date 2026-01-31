const axios = require('axios');
const { getBlackbirdInvoicePayload } = require('../utils/whatsappTemplates');

class WhatsAppService {
  /**
   * Send invoice message via WhatsApp using blackbird_invoice template
   * @param {String} phone - Customer phone number
   * @param {Object} bookingData - Booking data with populated branch
   * @returns {Promise<Object>} API response
   */
  async sendInvoiceMessage(phone, bookingData) {
    try {
      // Check if WhatsApp is enabled
      if (process.env.WHATSAPP_ENABLED !== 'true') {
        console.log('📱 WhatsApp is disabled in environment');
        return { success: false, message: 'WhatsApp is disabled' };
      }

      // Validate required config
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
   * Format phone number for WhatsApp API
   * @param {String} phone - Phone number
   * @returns {String} Formatted phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }
}

module.exports = new WhatsAppService();
