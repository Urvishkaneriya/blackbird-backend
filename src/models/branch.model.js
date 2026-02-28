const mongoose = require('mongoose');
const { VALIDATION, BRANCH_NUMBER_PREFIX } = require('../config/constants');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Branch phone number is required'],
      trim: true,
      match: [VALIDATION.PHONE_REGEX, 'Please provide a valid phone number (10-15 digits)'],
    },
    whatsappNumberId: {
      type: String,
      required: [true, 'Branch WhatsApp number ID is required'],
      trim: true,
      unique: true,
    },
    branchNumber: {
      type: String,
      unique: true,
      immutable: true,
    },
    employeeCount: {
      type: Number,
      default: 0,
      min: [0, 'Employee count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Generate branch number before saving
branchSchema.pre('save', async function (next) {
  if (!this.branchNumber) {
    // Get count of existing branches
    const count = await mongoose.model('Branch').countDocuments();
    const branchNum = (count + 1).toString().padStart(4, '0');
    this.branchNumber = `${BRANCH_NUMBER_PREFIX}${branchNum}`;
  }
  next();
});

// Indexes for faster queries
branchSchema.index({ branchNumber: 1 });
branchSchema.index({ name: 1 });
branchSchema.index({ whatsappNumberId: 1 });

// Remove __v from JSON responses
branchSchema.methods.toJSON = function () {
  const branch = this.toObject();
  delete branch.__v;
  return branch;
};

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
