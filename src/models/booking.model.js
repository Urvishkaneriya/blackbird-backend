const mongoose = require('mongoose');
const { VALIDATION, PAYMENT_METHODS, PAYMENT_MODES, BOOKING_NUMBER_PREFIX } = require('../config/constants');

const bookingItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price must be a positive number'],
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total must be a positive number'],
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    cashAmount: {
      type: Number,
      default: 0,
      min: [0, 'cashAmount cannot be negative'],
    },
    upiAmount: {
      type: Number,
      default: 0,
      min: [0, 'upiAmount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'totalAmount is required'],
      min: [0, 'totalAmount cannot be negative'],
    },
    paymentMode: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_MODES),
        message: `paymentMode must be ${PAYMENT_MODES.CASH}, ${PAYMENT_MODES.UPI} or ${PAYMENT_MODES.SPLIT}`,
      },
      required: [true, 'paymentMode is required'],
    },
  },
  { _id: false }
);

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
    items: {
      type: [bookingItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one item is required',
      },
    },
    size: {
      type: Number,
      min: [0, 'Size must be a positive number'],
    },
    artistName: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
    },
    payment: {
      type: paymentSchema,
      required: [true, 'Payment details are required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    // Creator id (admin or employee) - set from authenticated user
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Creator is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    reminderSentAt: {
      type: Date,
      default: null,
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
bookingSchema.index({ 'payment.paymentMode': 1 });

// Remove __v from JSON; add reminderSent boolean so API and cron never send twice
bookingSchema.methods.toJSON = function () {
  const booking = this.toObject();
  delete booking.__v;
  booking.amount = booking.payment?.totalAmount ?? 0;
  if (booking.payment?.paymentMode === PAYMENT_MODES.CASH) booking.paymentMethod = PAYMENT_METHODS.CASH;
  else if (booking.payment?.paymentMode === PAYMENT_MODES.UPI) booking.paymentMethod = PAYMENT_METHODS.UPI;
  else booking.paymentMethod = `${PAYMENT_METHODS.CASH} + ${PAYMENT_METHODS.UPI}`;
  booking.reminderSent = !!booking.reminderSentAt;
  return booking;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
