const axios = require('axios');
const {
  getBlackbirdInvoicePayload,
  getBlackbirdCheckupReminderPayload,
  buildTemplatePayload,
} = require('../utils/whatsappTemplates');

class WhatsAppService {
  resolveConfig(config = {}) {
    return {
      token: config.token || process.env.WHATSAPP_TOKEN || '',
      numberId: config.numberId || process.env.TEST_NUM_ID || '',
      accountId: config.accountId || process.env.WHATSAPP_ACCOUNT_ID || '',
      mediaId: config.mediaId || process.env.WHATSAPP_MEDIA_ID || '',
    };
  }

  async sendInvoiceMessage(phone, bookingData, config = {}) {
    try {
      const resolvedConfig = this.resolveConfig(config);
      if (!resolvedConfig.token || !resolvedConfig.numberId) {
        return { success: false, message: 'WhatsApp configuration missing' };
      }

      const formattedPhone = phone.replace(/\D/g, '');
      const template = getBlackbirdInvoicePayload(bookingData);
      const apiUrl = `https://graph.facebook.com/v18.0/${resolvedConfig.numberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template,
      };

      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${resolvedConfig.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('WhatsApp invoice sent:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('WhatsApp invoice failed:', {
        message: error.message,
        response: error.response?.data,
        phone,
      });
      return {
        success: false,
        message: error.message,
        error: error.response?.data || error.message,
      };
    }
  }

  async sendReminderMessage(phone, data, config = {}) {
    try {
      const resolvedConfig = this.resolveConfig(config);
      if (!resolvedConfig.token || !resolvedConfig.numberId) {
        return { success: false, message: 'WhatsApp configuration missing' };
      }

      const formattedPhone = phone.replace(/\D/g, '');
      const template = getBlackbirdCheckupReminderPayload(data.daysPassed, data.branchPhone);
      const apiUrl = `https://graph.facebook.com/v18.0/${resolvedConfig.numberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template,
      };

      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${resolvedConfig.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('WhatsApp reminder sent:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('WhatsApp reminder failed:', { message: error.message, phone });
      return { success: false, message: error.message };
    }
  }

  async sendMarketingMessage(phone, templateName, languageCode, orderedParameters, config = {}) {
    try {
      const resolvedConfig = this.resolveConfig(config);
      if (!resolvedConfig.token || !resolvedConfig.numberId) {
        return { success: false, message: 'WhatsApp configuration missing' };
      }

      const formattedPhone = phone.replace(/\D/g, '');
      const template = buildTemplatePayload(
        (templateName || '').trim(),
        orderedParameters,
        (languageCode || 'en').trim()
      );

      const headerMediaId = resolvedConfig.mediaId;
      if (headerMediaId) {
        if (!Array.isArray(template.components)) {
          template.components = template.components ? [template.components] : [];
        }
        template.components.unshift({
          type: 'header',
          parameters: [{ type: 'image', image: { id: headerMediaId } }],
        });
      }

      const apiUrl = `https://graph.facebook.com/v18.0/${resolvedConfig.numberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template,
      };

      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${resolvedConfig.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('WhatsApp marketing message sent:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data;
      const code = errData?.error?.code;
      console.error('WhatsApp marketing message failed:', {
        message: error.message,
        response: errData,
        phone,
      });
      if (code === 132012) {
        console.error('[132012] Template payload sent:', {
          templateName: (templateName || '').trim(),
          languageCode: (languageCode || 'en').trim(),
          parameterCount: Array.isArray(orderedParameters) ? orderedParameters.length : 0,
        });
      }
      return {
        success: false,
        message: error.message,
        error: errData || error.message,
      };
    }
  }

  formatPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
  }
}

module.exports = new WhatsAppService();
