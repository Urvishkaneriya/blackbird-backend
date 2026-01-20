const mongoose = require('mongoose');
const { VALIDATION } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [VALIDATION.PHONE_REGEX, 'Please provide a valid phone number (10-15 digits)'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [VALIDATION.EMAIL_REGEX, 'Please provide a valid email address'],
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'Total orders cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });

// Remove __v from JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
