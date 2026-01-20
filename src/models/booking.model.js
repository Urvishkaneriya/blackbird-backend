const mongoose = require('mongoose');
const { VALIDATION, PAYMENT_METHODS, BOOKING_NUMBER_PREFIX } = require('../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      immutable: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [VALIDATION.PHONE_REGEX, 'Please provide a valid phone number (10-15 digits)'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [VALIDATION.EMAIL_REGEX, 'Please provide a valid email address'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be a positive number'],
    },
    artistName: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Payment method must be either Cash or UPI',
      },
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Generate booking number before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingNumber) {
    // Get count of existing bookings
    const count = await mongoose.model('Booking').countDocuments();
    const bookingNum = (count + 1).toString().padStart(4, '0');
    this.bookingNumber = `${BOOKING_NUMBER_PREFIX}${bookingNum}`;
  }
  next();
});

// Indexes for faster queries
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ phone: 1 });
bookingSchema.index({ branchId: 1 });
bookingSchema.index({ employeeId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ date: -1 });

// Remove __v from JSON responses
bookingSchema.methods.toJSON = function () {
  const booking = this.toObject();
  delete booking.__v;
  return booking;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
