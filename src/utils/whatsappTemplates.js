/**
 * WhatsApp Template Definitions.
 * Keep template names and parameter order in sync with Meta templates.
 */

const TEMPLATE_NAMES = {
  BLACKBIRD_INVOICE: 'blackbird_invoice',
  BLACKBIRD_CHECKUP_REMINDER: 'blackbird_checkup_reminder',
};

const DEFAULT_LANGUAGE = 'en';

function normalizeLanguageCode(code) {
  const raw = (code || DEFAULT_LANGUAGE).trim();
  if (!raw) return DEFAULT_LANGUAGE;
  const base = raw.split('_')[0].toLowerCase();
  return base || DEFAULT_LANGUAGE;
}

function buildTemplatePayload(templateName, bodyParameters, languageCode = DEFAULT_LANGUAGE) {
  if (!bodyParameters || !Array.isArray(bodyParameters)) {
    throw new Error('bodyParameters must be a non-empty array');
  }

  const parameters = bodyParameters.map((val) => {
    let text = val === null || val === undefined ? '' : String(val);
    text = text.trim().replace(/\r?\n/g, ' ');
    if (text === '') text = '-';
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
 * Invoice template body mapping:
 * {{1}} fullName
 * {{2}} bookingNumber
 * {{3}} artistName
 * {{4}} branchName
 * {{5}} bookingDate
 * {{6}} size
 * {{7}} paymentMethodText (CASH / UPI / CASH + UPI)
 * {{8}} amountText (for example: ₹300 CASH + ₹400 UPI)
 */
function getBlackbirdInvoicePayload(bookingData) {
  const {
    fullName,
    bookingNumber,
    artistName,
    branchId,
    date,
    size,
    payment,
    totalAmount,
  } = bookingData;

  const bookingDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const branchName = branchId?.name || branchId || 'N/A';

  const cashAmount = Number(payment?.cashAmount || 0);
  const upiAmount = Number(payment?.upiAmount || 0);
  const total = Number(totalAmount ?? payment?.totalAmount ?? 0);

  let paymentMethodText = 'N/A';
  if (cashAmount > 0 && upiAmount > 0) paymentMethodText = 'CASH + UPI';
  else if (cashAmount > 0) paymentMethodText = 'CASH';
  else if (upiAmount > 0) paymentMethodText = 'UPI';

  const parts = [];
  if (cashAmount > 0) parts.push(`₹${cashAmount.toLocaleString('en-IN')} CASH`);
  if (upiAmount > 0) parts.push(`₹${upiAmount.toLocaleString('en-IN')} UPI`);
  const amountText = parts.length > 0 ? parts.join(' + ') : `₹${total.toLocaleString('en-IN')}`;

  const bodyParameters = [
    fullName || 'Customer',
    bookingNumber || 'N/A',
    artistName || 'N/A',
    branchName,
    bookingDate,
    String(size ?? ''),
    paymentMethodText,
    amountText,
  ];

  return buildTemplatePayload(TEMPLATE_NAMES.BLACKBIRD_INVOICE, bodyParameters);
}

function getBlackbirdCheckupReminderPayload(fullName, daysPassed) {
  const bodyParameters = [
    fullName || 'Customer',
    String(daysPassed ?? 0),
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
