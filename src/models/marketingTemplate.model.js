const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
      required: true,
      min: [1, 'Position must be at least 1'],
    },
    type: {
      type: String,
      enum: ['string', 'number', 'date'],
      default: 'string',
    },
    required: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const marketingTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp'],
      default: 'whatsapp',
    },
    whatsappTemplateName: {
      type: String,
      required: [true, 'WhatsApp template name is required'],
      trim: true,
    },
    languageCode: {
      type: String,
      default: 'en',
    },
    bodyExample: {
      type: String,
      default: '',
    },
    parameters: {
      type: [parameterSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
marketingTemplateSchema.index({ name: 1 });
marketingTemplateSchema.index({ isActive: 1 });
marketingTemplateSchema.index({ createdBy: 1 });

// Remove __v from JSON
marketingTemplateSchema.methods.toJSON = function () {
  const template = this.toObject();
  delete template.__v;
  return template;
};

const MarketingTemplate = mongoose.model('MarketingTemplate', marketingTemplateSchema);

module.exports = MarketingTemplate;
