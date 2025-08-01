// controllers/productController.js
const productService = require('../services/productService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');
const { CustomError } = require('../utils/helpers');

const productController = {
    // --- PRODUK ---
    async createProduct(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors during product creation:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { name, description, modalPrice, retailPrice, wholesalePrice, stock, categoryId, unit, barcode } = req.body; // <-- TAMBAHKAN BARCODE
            const imageUrl = req.file ? req.file.path : null;

            const product = await productService.createProduct({
                name,
                description,
                modalPrice: parseFloat(modalPrice),
                retailPrice: parseFloat(retailPrice),
                wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
                stock: parseInt(stock),
                categoryId,
                unit,
                imageUrl,
                barcode // <-- SERTAKAN BARCODE
            });
            return successResponse(res, 'Product created successfully.', product);
        } catch (error) {
            logger.error(`Error creating product: ${error.message}`, { stack: error.stack, body: req.body, file: req.file });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to create product.', 500);
        }
    },

    async getAllProducts(req, res) {
        try {
            const filters = req.query;
            const products = await productService.getAllProducts(filters);
            return successResponse(res, 'Products fetched successfully.', products);
        } catch (error) {
            logger.error(`Error fetching all products: ${error.message}`, { stack: error.stack, query: req.query });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to fetch products.', 500);
        }
    },

    async getProductById(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors for getProductById:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);
            return successResponse(res, 'Product fetched successfully.', product);
        } catch (error) {
            logger.error(`Error fetching product by ID: ${error.message}`, { stack: error.stack, params: req.params });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to fetch product.', 500);
        }
    },

    /**
     * Mendapatkan produk berdasarkan barcode.
     * @param {object} req - Objek request Express.
     * @param {object} res - Objek response Express.
     */
    async getProductByBarcode(req, res) { // <-- FUNGSI BARU
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors for getProductByBarcode:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { barcode } = req.params; // Ambil barcode dari URL params
            const product = await productService.getProductByBarcode(barcode);
            return successResponse(res, 'Product fetched successfully by barcode.', product);
        } catch (error) {
            logger.error(`Error fetching product by barcode: ${error.message}`, { stack: error.stack, params: req.params });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to fetch product by barcode.', 500);
        }
    },

    async updateProduct(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors during product update:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { id } = req.params;
            const updateData = req.body;
            if (req.file) {
                updateData.imageUrl = req.file.path;
            }

            // Parsing nilai numerik jika ada di updateData
            if (updateData.modalPrice) updateData.modalPrice = parseFloat(updateData.modalPrice);
            if (updateData.retailPrice) updateData.retailPrice = parseFloat(updateData.retailPrice);
            if (updateData.wholesalePrice) updateData.wholesalePrice = parseFloat(updateData.wholesalePrice);
            if (updateData.stock) updateData.stock = parseInt(updateData.stock);

            // Barcode juga bisa diupdate
            if (updateData.barcode) updateData.barcode = updateData.barcode.toString().trim();


            const updatedProduct = await productService.updateProduct(id, updateData);
            return successResponse(res, 'Product updated successfully.', updatedProduct);
        } catch (error) {
            logger.error(`Error updating product: ${error.message}`, { stack: error.stack, params: req.params, body: req.body, file: req.file });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to update product.', 500);
        }
    },

    async deleteProduct(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors for deleteProduct:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { id } = req.params;
            await productService.deleteProduct(id);
            return successResponse(res, 'Product deleted successfully.');
        } catch (error) {
            logger.error(`Error deleting product: ${error.message}`, { stack: error.stack, params: req.params });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to delete product.', 500);
        }
    },

    // --- KATEGORI ---
    async createCategory(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors during category creation:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const category = await productService.createCategory(req.body);
            return successResponse(res, 'Category created successfully.', category);
        } catch (error) {
            logger.error(`Error creating category: ${error.message}`, { stack: error.stack, body: req.body });
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    },

    async getAllCategories(req, res) {
        try {
            const categories = await productService.getAllCategories();
            return successResponse(res, 'Categories fetched successfully.', categories);
        } catch (error) {
            logger.error(`Error fetching all categories: ${error.message}`, { stack: error.stack });
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    },

    async getCategoryById(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors for getCategoryById:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { id } = req.params;
            const category = await productService.getCategoryById(id);
            return successResponse(res, 'Category fetched successfully.', category);
        } catch (error) {
            logger.error(`Error fetching category by ID: ${error.message}`, { stack: error.stack, params: req.params });
            return errorResponse(res, error.message, error.statusCode || 404);
        }
    },

    async updateCategory(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors during category update:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { id } = req.params;
            const updatedCategory = await productService.updateCategory(id, req.body);
            return successResponse(res, 'Category updated successfully.', updatedCategory);
        } catch (error) {
            logger.error(`Error updating category: ${error.message}`, { stack: error.stack, params: req.params, body: req.body });
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    },

    async deleteCategory(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors for deleteCategory:', { errors: errors.array() });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const { id } = req.params;
            await productService.deleteCategory(id);
            return successResponse(res, 'Category deleted successfully.');
        } catch (error) {
            logger.error(`Error deleting category: ${error.message}`, { stack: error.stack, params: req.params });
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    }
};

module.exports = productController;