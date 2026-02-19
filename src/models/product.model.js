const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      unique: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price must be a positive number'],
    },
    isDefault: {
      type: Boolean,
      default: false,
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 1 }, { unique: true });
productSchema.index({ isActive: 1 });

productSchema.methods.toJSON = function () {
  const product = this.toObject();
  delete product.__v;
  return product;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
