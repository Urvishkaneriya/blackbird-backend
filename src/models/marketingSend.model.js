const mongoose = require('mongoose');

const marketingSendSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketingTemplate',
      required: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    audienceType: {
      type: String,
      enum: ['single', 'list', 'branch_customers', 'all_customers'],
      required: true,
    },
    audienceFilter: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    perUserParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'partial'],
      default: 'pending',
    },
    stats: {
      total: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
marketingSendSchema.index({ templateId: 1 });
marketingSendSchema.index({ triggeredBy: 1 });
marketingSendSchema.index({ status: 1 });
marketingSendSchema.index({ createdAt: -1 });

// Remove __v from JSON
marketingSendSchema.methods.toJSON = function () {
  const send = this.toObject();
  delete send.__v;
  return send;
};

const MarketingSend = mongoose.model('MarketingSend', marketingSendSchema);

module.exports = MarketingSend;
