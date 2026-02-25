const REQUIRED_VARS = ['MONGO_URL', 'JWT_SECRET'];

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function parseCsv(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && String(process.env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

}

validateEnv();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseNumber(process.env.PORT, 5000),
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGIN),
  TRUST_PROXY: parseNumber(process.env.TRUST_PROXY, 1),
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '1mb',
  URL_ENCODED_LIMIT: process.env.URL_ENCODED_LIMIT || '1mb',
  RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 200),
  ENABLE_CRON: parseBoolean(process.env.ENABLE_CRON, true),
  REMINDER_CRON_EXPRESSION: process.env.REMINDER_CRON_EXPRESSION || '0 */12 * * *',
  CRON_TIMEZONE: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
};
