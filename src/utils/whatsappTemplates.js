/**
 * WhatsApp Template Definitions
 * Centralized template names and parameter mapping for easy maintenance.
 * When you add/change templates in Meta Business Suite, update this file.
 *
 * blackbird_invoice template structure:
 *   Hello {{1}},           -> Customer full name
 *   Invoice No: {{2}}      -> Booking number (e.g. INV0001)
 *   Artist: {{3}}          -> Artist name
 *   Branch: {{4}}          -> Branch name
 *   Date: {{5}}            -> Formatted date
 *   Size: {{6}}            -> Size (number)
 *   Payment Method: {{7}}  -> CASH or UPI
 *   Amount Paid: ₹{{8}}    -> Amount (number only, no ₹)
 */

// Template names (must match exactly with Meta WhatsApp Business)
const TEMPLATE_NAMES = {
  BLACKBIRD_INVOICE: 'blackbird_invoice',
  BLACKBIRD_CHECKUP_REMINDER: 'blackbird_checkup_reminder',
};

// Default language for templates (same as invoice/reminder – Meta expects this format)
const DEFAULT_LANGUAGE = 'en';

/**
 * Normalize language code for WhatsApp API. Meta templates use base code (e.g. "en");
 * locale variants like "en_US" can cause 132012 if template was created as "English" (en).
 * Use base part only so we match how invoice/reminder send (no 3rd arg = default "en").
 */
function normalizeLanguageCode(code) {
  const raw = (code || DEFAULT_LANGUAGE).trim();
  if (!raw) return DEFAULT_LANGUAGE;
  const base = raw.split('_')[0].toLowerCase();
  return base || DEFAULT_LANGUAGE;
}

/**
 * Build template payload for WhatsApp Cloud API
 * @param {String} templateName - Template name from TEMPLATE_NAMES
 * @param {Array<{type: string, text: string}>} bodyParameters - Ordered parameters for {{1}}, {{2}}, etc.
 * @param {String} languageCode - Optional language code (default: 'en'); normalized to base (en_US → en)
 * @returns {Object} Template object for API payload
 */
function buildTemplatePayload(templateName, bodyParameters, languageCode = DEFAULT_LANGUAGE) {
  if (!bodyParameters || !Array.isArray(bodyParameters)) {
    throw new Error('bodyParameters must be a non-empty array');
  }

  // WhatsApp rejects empty or invalid body parameter values; sanitize for 132012
  const parameters = bodyParameters.map((val) => {
    let text = val === null || val === undefined ? '' : String(val);
    text = text.trim().replace(/\r?\n/g, ' '); // no newlines in body params
    if (text === '') text = '-'; // avoid empty string (can cause parameter format mismatch)
    return { type: 'text', text };
  });

  const name = (templateName || '').trim();
  return {
    name,
    language: {
      code: normalizeLanguageCode(languageCode),
    },
    components: [
      {
        type: 'body',
        parameters,
      },
    ],
  };
}

/**
 * Get template payload for blackbird_invoice
 * Template: Hello {{1}}, Your order... Invoice No: {{2}} Artist: {{3}} Branch: {{4}} Date: {{5}} Size: {{6}} Payment: {{7}} Amount: ₹{{8}}
 * @param {Object} bookingData - Booking data
 * @returns {Object} Template payload for API
 */
function getBlackbirdInvoicePayload(bookingData) {
  const {
    fullName,
    bookingNumber,
    artistName,
    branchId,
    date,
    size,
    paymentMethod,
    amount,
  } = bookingData;

  // Format date
  const bookingDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Branch name (populated object or ID)
  const branchName = branchId?.name || branchId || 'N/A';

  // Amount - number only (template has ₹ before {{8}})
  const amountText = amount != null ? Number(amount).toLocaleString('en-IN') : '0';

  const bodyParameters = [
    fullName || 'Customer',           // {{1}} Hello {{1}}
    bookingNumber || 'N/A',          // {{2}} Invoice No
    artistName || 'N/A',              // {{3}} Artist
    branchName,                       // {{4}} Branch
    bookingDate,                     // {{5}} Date
    String(size ?? ''),              // {{6}} Size
    paymentMethod || 'N/A',          // {{7}} Payment Method
    amountText,                      // {{8}} Amount (₹ is in template)
  ];

  return buildTemplatePayload(TEMPLATE_NAMES.BLACKBIRD_INVOICE, bodyParameters);
}

/**
 * Get template payload for blackbird_checkup_reminder
 * Template: Hello {{1}}, Post-service care update. {{2}} days have passed...
 * @param {String} fullName - Customer name
 * @param {Number} daysPassed - Days since tattoo session
 * @returns {Object} Template payload for API
 */
function getBlackbirdCheckupReminderPayload(fullName, daysPassed) {
  const bodyParameters = [
    fullName || 'Customer',           // {{1}}
    String(daysPassed ?? 0),          // {{2}}
  ];
  return buildTemplatePayload(TEMPLATE_NAMES.BLACKBIRD_CHECKUP_REMINDER, bodyParameters);
}

module.exports = {
  TEMPLATE_NAMES,
  DEFAULT_LANGUAGE,
  normalizeLanguageCode,
  buildTemplatePayload,
  getBlackbirdInvoicePayload,
  getBlackbirdCheckupReminderPayload,
};
