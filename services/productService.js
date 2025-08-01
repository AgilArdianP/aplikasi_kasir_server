const { Product, Category, Discount } = require('../models');
const { CustomError } = require('../utils/helpers');
const logger = require('../config/winston');
const { Op } = require('sequelize');

const productService = {
    async createProduct(productData) {
        try {
            const product = await Product.create(productData);
            logger.info(`Product created: ${product.name} (${product.id})`);
            return product;
        } catch (error) {
            logger.error(`Error creating product in service: ${error.message}`, { productData });
            if (error.name === 'SequelizeUniqueConstraintError') {
                if (error.fields && error.fields.name) {
                    throw new CustomError('Product name already exists.', 409);
                }
                if (error.fields && error.fields.barcode) { // Tangani error unique barcode
                    throw new CustomError('Barcode already exists for another product.', 409);
                }
            }
            throw new CustomError('Failed to create product.', 500);
        }
    },

    async getAllProducts(filters = {}) {
        const whereClause = {};
        if (filters.categoryId) {
            whereClause.categoryId = filters.categoryId;
        }
        if (filters.name) {
            whereClause.name = { [Op.like]: `%${filters.name}%` };
        }
        if (filters.barcode) { // Filter berdasarkan barcode
            whereClause.barcode = filters.barcode;
        }

        try {
            const products = await Product.findAll({
                where: whereClause,
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name']
                    },
                    { // Include applied discounts
                        model: Discount,
                        as: 'appliedDiscounts', // Pastikan alias ini cocok dengan Product.associate
                        attributes: ['id', 'name', 'type', 'value', 'startDate', 'endDate'],
                        through: { attributes: [] }, // Jangan tampilkan kolom dari tabel pivot
                        required: false // Gunakan false agar produk tetap muncul meski tanpa diskon
                    }
                ]
            });
            return products;
        } catch (error) {
            logger.error(`Error fetching all products in service: ${error.message}`);
            throw new CustomError('Failed to fetch products.', 500);
        }
    },

    async getProductById(id) {
        try {
            const product = await Product.findByPk(id, {
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name']
                    },
                    { // Include applied discounts
                        model: Discount,
                        as: 'appliedDiscounts',
                        attributes: ['id', 'name', 'type', 'value', 'startDate', 'endDate'],
                        through: { attributes: [] },
                        required: false
                    }
                ]
            });
            if (!product) {
                throw new CustomError('Product not found.', 404);
            }
            return product;
        } catch (error) {
            logger.error(`Error fetching product by ID in service: ${error.message}`, { id });
            throw new CustomError('Failed to fetch product.', 500);
        }
    },

    /**
     * Mendapatkan produk berdasarkan barcode.
     * @param {string} barcode
     * @returns {Promise<Product>} Produk yang ditemukan
     */
    async getProductByBarcode(barcode) {
        try {
            const product = await Product.findOne({
                where: { barcode: barcode },
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name']
                    },
                    { // Include applied discounts
                        model: Discount,
                        as: 'appliedDiscounts',
                        attributes: ['id', 'name', 'type', 'value', 'startDate', 'endDate'],
                        through: { attributes: [] },
                        required: false
                    }
                ]
            });
            if (!product) {
                throw new CustomError('Product with this barcode not found.', 404);
            }
            logger.info(`Product found by barcode: ${barcode}`);
            return product;
        } catch (error) {
            logger.error(`Error fetching product by barcode ${barcode}: ${error.message}`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to retrieve product by barcode.', 500);
        }
    },

    async updateProduct(id, updateData) {
        const t = await db.sequelize.transaction();
        try {
            const product = await Product.findByPk(id, { transaction: t });
            if (!product) {
                throw new CustomError('Product not found.', 404);
            }

            // Jika barcode diupdate, cek keunikan
            if (updateData.barcode && updateData.barcode !== product.barcode) {
                const existingProductWithBarcode = await Product.findOne({
                    where: { barcode: updateData.barcode, id: { [Op.ne]: id } },
                    transaction: t
                });
                if (existingProductWithBarcode) {
                    throw new CustomError('Barcode already exists for another product.', 409);
                }
            }

            await product.update(updateData, { transaction: t });
            const updatedProduct = await Product.findByPk(id, { // Ambil lagi untuk menyertakan kategori dan diskon
                include: [
                    { model: Category, as: 'category', attributes: ['id', 'name'] },
                    { model: Discount, as: 'appliedDiscounts', attributes: ['id', 'name'], through: { attributes: [] }, required: false }
                ],
                transaction: t
            });
            logger.info(`Product updated: ${updatedProduct.name} (${updatedProduct.id})`);
            await t.commit();
            return updatedProduct;
        } catch (error) {
            await t.rollback();
            logger.error(`Error updating product in service: ${error.message}`, { id, updateData });
            if (error.name === 'SequelizeUniqueConstraintError') { // Tangani unique constraint error
                if (error.fields && error.fields.name) {
                    throw new CustomError('Product name already exists.', 409);
                }
                if (error.fields && error.fields.barcode) {
                    throw new CustomError('Barcode already exists for another product.', 409);
                }
            }
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update product.', 500);
        }
    },

    async deleteProduct(id) {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                throw new CustomError('Product not found.', 404);
            }
            await product.destroy();
            logger.info(`Product deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting product in service: ${error.message}`, { id });
            throw new CustomError('Failed to delete product.', 500);
        }
    },

    async createCategory(categoryData) {
        try {
            const category = await Category.create(categoryData);
            logger.info(`Category created: ${category.name} (${category.id})`);
            return category;
        } catch (error) {
            logger.error(`Error creating category in service: ${error.message}`, { categoryData });
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new CustomError('Category name already exists.', 409);
            }
            throw new CustomError('Failed to create category.', 500);
        }
    },

    async getAllCategories() {
        try {
            const categories = await Category.findAll();
            return categories;
        } catch (error) {
            logger.error(`Error fetching all categories in service: ${error.message}`);
            throw new CustomError('Failed to fetch categories.', 500);
        }
    },

    async getCategoryById(id) {
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new CustomError('Category not found.', 404);
            }
            return category;
        } catch (error) {
            logger.error(`Error fetching category by ID in service: ${error.message}`, { id });
            throw new CustomError('Failed to fetch category.', 500);
        }
    },

    async updateCategory(id, updateData) {
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new CustomError('Category not found.', 404);
            }
            await category.update(updateData);
            const updatedCategory = await Category.findByPk(id);
            logger.info(`Category updated: ${updatedCategory.name} (${updatedCategory.id})`);
            return updatedCategory;
        } catch (error) {
            logger.error(`Error updating category in service: ${error.message}`, { id, updateData });
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new CustomError('Category name already exists.', 409);
            }
            throw new CustomError('Failed to update category.', 500);
        }
    },

    async deleteCategory(id) {
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new CustomError('Category not found.', 404);
            }
            await category.destroy();
            logger.info(`Category deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting category in service: ${error.message}`, { id });
            throw new CustomError('Failed to delete category.', 500);
        }
    }
};

module.exports = productService;