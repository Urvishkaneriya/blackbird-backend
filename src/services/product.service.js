const Product = require('../models/product.model');

const DEFAULT_PRODUCT_NAME = 'Tattoo';

class ProductService {
  async seedDefaultProduct() {
    const existing = await Product.findOne({ isDefault: true });
    if (existing) return existing;

    const defaultProduct = new Product({
      name: DEFAULT_PRODUCT_NAME,
      basePrice: 0,
      isDefault: true,
      isActive: true,
    });
    return defaultProduct.save();
  }

  async createProduct(data) {
    const product = new Product({
      name: data.name,
      basePrice: data.basePrice,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      isDefault: false,
    });
    return product.save();
  }

  async getProducts(filters = {}) {
    const query = {};
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    return Product.find(query).sort({ isDefault: -1, createdAt: -1 });
  }

  async findById(id) {
    return Product.findById(id);
  }

  async getDefaultProduct() {
    return Product.findOne({ isDefault: true });
  }

  async updateProduct(id, data) {
    const existing = await Product.findById(id);
    if (!existing) return null;

    if (existing.isDefault) {
      if (data.name !== undefined) existing.name = data.name;
      if (data.basePrice !== undefined) existing.basePrice = data.basePrice;
      if (data.isActive !== undefined && Boolean(data.isActive) === false) {
        throw new Error('Default Tattoo product cannot be deactivated');
      }
      if (data.isActive !== undefined) existing.isActive = Boolean(data.isActive);
      return existing.save();
    }

    if (data.name !== undefined) existing.name = data.name;
    if (data.isActive !== undefined) existing.isActive = Boolean(data.isActive);
    return existing.save();
  }

  async updateProductStatus(id, isActive) {
    const existing = await Product.findById(id);
    if (!existing) return null;
    if (existing.isDefault && Boolean(isActive) === false) {
      throw new Error('Default Tattoo product cannot be deactivated');
    }
    existing.isActive = Boolean(isActive);
    return existing.save();
  }
}

module.exports = new ProductService();
