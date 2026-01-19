const { STATUS_CODES } = require('../config/constants');

/**
 * Standard API response formatter
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Response message
 * @param {Object} data - Response data (optional)
 * @param {Object} headers - Additional headers (optional)
 */
const sendResponse = (res, statusCode, message, data = null, headers = {}) => {
  const response = {
    message,
    data,
  };

  // Set additional headers if provided
  Object.keys(headers).forEach((key) => {
    res.setHeader(key, headers[key]);
  });

  return res.status(statusCode).json(response);
};

/**
 * Success response helper
 */
const successResponse = (res, message, data = null, headers = {}) => {
  return sendResponse(res, STATUS_CODES.OK, message, data, headers);
};

/**
 * Created response helper
 */
const createdResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.CREATED, message, data);
};

/**
 * Error response helper
 */
const errorResponse = (res, statusCode, message, data = null) => {
  return sendResponse(res, statusCode, message, data);
};

/**
 * Bad request response helper
 */
const badRequestResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.BAD_REQUEST, message, data);
};

/**
 * Unauthorized response helper
 */
const unauthorizedResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.UNAUTHORIZED, message, data);
};

/**
 * Forbidden response helper
 */
const forbiddenResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.FORBIDDEN, message, data);
};

/**
 * Not found response helper
 */
const notFoundResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.NOT_FOUND, message, data);
};

/**
 * Conflict response helper
 */
const conflictResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.CONFLICT, message, data);
};

/**
 * Internal server error response helper
 */
const serverErrorResponse = (res, message, data = null) => {
  return sendResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, message, data);
};

module.exports = {
  sendResponse,
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  serverErrorResponse,
};
