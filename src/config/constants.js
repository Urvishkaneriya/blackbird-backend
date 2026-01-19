// User Roles
const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

// JWT Configuration
const JWT_CONFIG = {
  EXPIRY: '50h', // 50 hours
  REFRESH_THRESHOLD_HOURS: 25, // Refresh token if less than 25 hours left
};

// Bcrypt Configuration
const BCRYPT_SALT_ROUNDS = 10;

// Employee Number Configuration
const EMPLOYEE_NUMBER_PREFIX = 'EMP';

// Response Messages
const MESSAGES = {
  // Auth Messages
  LOGIN_SUCCESS: 'Login successful',
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_REQUIRED: 'Access token is required',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_REFRESHED: 'Token has been refreshed',
  ADMIN_ONLY: 'Only admins can access this resource',

  // Employee Messages
  EMPLOYEE_CREATED: 'Employee created successfully',
  EMPLOYEE_UPDATED: 'Employee updated successfully',
  EMPLOYEE_DELETED: 'Employee deleted successfully',
  EMPLOYEE_FETCHED: 'Employee fetched successfully',
  EMPLOYEES_FETCHED: 'Employees fetched successfully',
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  EMPLOYEE_ALREADY_EXISTS: 'Employee with this email already exists',

  // Admin Messages
  ADMIN_SEEDED: 'Admin user created successfully',
  ADMIN_EXISTS: 'Admin user already exists',

  // General Messages
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found',
};

// HTTP Status Codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Validation Patterns
const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[0-9]{10,15}$/,
  PASSWORD_MIN_LENGTH: 6,
};

module.exports = {
  ROLES,
  JWT_CONFIG,
  BCRYPT_SALT_ROUNDS,
  EMPLOYEE_NUMBER_PREFIX,
  MESSAGES,
  STATUS_CODES,
  VALIDATION,
};
