const productService = require('../services/product.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
} = require('../utils/response');
const { MESSAGES } = require('../config/constants');

class ProductController {
  async createProduct(req, res, next) {
    try {
      const { name, basePrice, isActive } = req.body;
      if (!name || basePrice === undefined || basePrice === null) {
        return badRequestResponse(res, 'name and basePrice are required');
      }
      if (Number(basePrice) < 0) {
        return badRequestResponse(res, 'basePrice must be a positive number');
      }

      const product = await productService.createProduct({
        name: String(name).trim(),
        basePrice: Number(basePrice),
        isActive,
      });

      return createdResponse(res, MESSAGES.PRODUCT_CREATED, product);
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req, res, next) {
    try {
      const { isActive } = req.query;
      const filters = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      const products = await productService.getProducts(filters);
      return successResponse(res, MESSAGES.PRODUCTS_FETCHED, {
        count: products.length,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.basePrice !== undefined && Number(updateData.basePrice) < 0) {
        return badRequestResponse(res, 'basePrice must be a positive number');
      }
      if (updateData.basePrice !== undefined) {
        updateData.basePrice = Number(updateData.basePrice);
      }

      const product = await productService.updateProduct(id, updateData);
      if (!product) return notFoundResponse(res, MESSAGES.PRODUCT_NOT_FOUND);

      return successResponse(res, MESSAGES.PRODUCT_UPDATED, product);
    } catch (error) {
      if (error.message === 'Default Tattoo product cannot be deactivated') {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return badRequestResponse(res, 'isActive is required');
      }
      const product = await productService.updateProductStatus(id, isActive);
      if (!product) return notFoundResponse(res, MESSAGES.PRODUCT_NOT_FOUND);
      return successResponse(res, MESSAGES.PRODUCT_UPDATED, product);
    } catch (error) {
      if (error.message === 'Default Tattoo product cannot be deactivated') {
        return badRequestResponse(res, error.message);
      }
      next(error);
    }
  }
}

module.exports = new ProductController();
