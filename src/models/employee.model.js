const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { ROLES, VALIDATION, EMPLOYEE_NUMBER_PREFIX } = require('../config/constants');

const employeeSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      immutable: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [VALIDATION.EMAIL_REGEX, 'Please provide a valid email address'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [VALIDATION.PHONE_REGEX, 'Please provide a valid phone number (10-15 digits)'],
    },
    employeeNumber: {
      type: String,
      unique: true,
      immutable: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`],
    },
    role: {
      type: String,
      default: ROLES.EMPLOYEE,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate employee number before saving
employeeSchema.pre('save', async function (next) {
  if (!this.employeeNumber) {
    // Get count of existing employees
    const count = await mongoose.model('Employee').countDocuments();
    const empNumber = (count + 1).toString().padStart(4, '0');
    this.employeeNumber = `${EMPLOYEE_NUMBER_PREFIX}${empNumber}`;
  }
  next();
});

// Indexes for faster queries
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeNumber: 1 });
employeeSchema.index({ uniqueId: 1 });

// Remove password from JSON responses
employeeSchema.methods.toJSON = function () {
  const employee = this.toObject();
  delete employee.password;
  delete employee.__v;
  return employee;
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
