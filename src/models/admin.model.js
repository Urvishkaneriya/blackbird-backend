const mongoose = require('mongoose');
const { ROLES, VALIDATION } = require('../config/constants');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`],
    },
    role: {
      type: String,
      default: ROLES.ADMIN,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
adminSchema.index({ email: 1 });

// Remove password from JSON responses
adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.__v;
  return admin;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
