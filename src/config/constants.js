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

// Branch Number Configuration
const BRANCH_NUMBER_PREFIX = 'BRANCH';

// Booking Number Configuration
const BOOKING_NUMBER_PREFIX = 'INV';

// Payment Methods
const PAYMENT_METHODS = {
  CASH: 'CASH',
  UPI: 'UPI',
};

const PAYMENT_MODES = {
  CASH: 'CASH',
  UPI: 'UPI',
  SPLIT: 'SPLIT',
};

// Marketing Template Dynamic Fields (enum for frontend dropdown)
const MARKETING_DYNAMIC_FIELDS = {
  USER_FULLNAME: 'user_fullName',
  USER_PHONE: 'user_phone',
  USER_EMAIL: 'user_email',
  BRANCH_NAME: 'branch_name',
  BRANCH_NUMBER: 'branch_number',
};

// Mapping dynamic field enum to actual database field paths
const MARKETING_FIELD_MAPPING = {
  'user_fullName': { type: 'user', field: 'fullName' },
  'user_phone': { type: 'user', field: 'phone' },
  'user_email': { type: 'user', field: 'email' },
  'branch_name': { type: 'branch', field: 'name' },
  'branch_number': { type: 'branch', field: 'branchNumber' },
};

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

  // Branch Messages
  BRANCH_CREATED: 'Branch created successfully',
  BRANCH_UPDATED: 'Branch updated successfully',
  BRANCHES_FETCHED: 'Branches fetched successfully',
  BRANCH_FETCHED: 'Branch fetched successfully',
  BRANCH_NOT_FOUND: 'Branch not found',
  BRANCH_ALREADY_EXISTS: 'Branch with this name already exists',

  // Booking Messages
  BOOKING_CREATED: 'Booking created successfully',
  BOOKINGS_FETCHED: 'Bookings fetched successfully',
  BOOKING_NOT_FOUND: 'Booking not found',
  INVALID_BOOKING_ITEMS: 'At least one booking item is required',
  INVALID_PAYMENT_BREAKDOWN: 'Payment breakdown is invalid',

  // Product Messages
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCTS_FETCHED: 'Products fetched successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_NOT_FOUND: 'Product not found',

  // User Messages
  USERS_FETCHED: 'Users fetched successfully',
  USER_NOT_FOUND: 'User not found',

  // Dashboard Messages
  DASHBOARD_FETCHED: 'Dashboard data fetched successfully',
  DASHBOARD_DATE_RANGE_REQUIRED: 'startDate and endDate are required (format: YYYY-MM-DD)',

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
  BRANCH_NUMBER_PREFIX,
  BOOKING_NUMBER_PREFIX,
  PAYMENT_METHODS,
  PAYMENT_MODES,
  MARKETING_DYNAMIC_FIELDS,
  MARKETING_FIELD_MAPPING,
  MESSAGES,
  STATUS_CODES,
  VALIDATION,
};
