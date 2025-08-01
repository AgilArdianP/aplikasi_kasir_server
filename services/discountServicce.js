const { Op } = require('sequelize');
const db = require('../models');
const Discount = db.Discount;
const Product = db.Product;
const { CustomError } = require('../utils/helpers');
const logger = require('../config/winston');


class DiscountService {
    /**
     * Membuat diskon baru.
     * @param {Object} discountData
     * @param {Array<string>} [productIds]
     * @returns {Promise<Discount>}
     */
    async createDiscount(discountData, productIds = []) {
        const t = await db.sequelize.transaction();
        try {
            if (new Date(discountData.startDate) >= new Date(discountData.endDate)) {
                throw new CustomError('End date must be after start date.', 400);
            }

            const discount = await Discount.create(discountData, { transaction: t });
            logger.info(`Discount "${discount.name}" (ID: ${discount.id}) created.`);

            if (discount.appliesTo === 'specific_products' && productIds && productIds.length > 0) {
                const products = await Product.findAll({
                    where: { id: { [Op.in]: productIds } },
                    transaction: t
                });

                if (products.length !== productIds.length) {
                    throw new CustomError('One or more product IDs provided for specific discount are invalid.', 400);
                }

                await discount.addDiscountedProducts(products, { transaction: t });
                logger.info(`Discount ${discount.id} applied to ${products.length} specific products.`);
            } else if (discount.appliesTo === 'specific_products' && (!productIds || productIds.length === 0)) {
                throw new CustomError('Product IDs are required  when discount applies to specific product.', 400);
            }

            await t.commit();
            return discount;
        } catch (error) {
            await t.rollback();
            logger.error(`Failed to crate discount: ${error.message}`, { error })

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError('Failed to create discount due to an internal error.', 500);
        }
    }

    /**
     * Mendapatkan semua diskon.
     * @param {Object} filters
     * @returns {Promise<Array<Discount>>}
     */
    async getAllDiscounts(filters = {}) {
        const whereClause = {};
        if (filters.isActive !== undefined) {
            whereClause.isActive = filters.isActive;
        }
        if (filters.type) {
            whereClause.type = filters.type;
        }
        if (filters.appliesTo) {
            whereClause.appliesTo = filters.appliesTo;
        }

        try {
            const discounts = await Discount.findAll({
                where: whereClause,
                include: [
                    {
                        model: db.Product,
                        as: 'discountedProducts',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            logger.info(`Retrivied ${discounts.length} discounts with filters: ${JSON.stringify(filters)}`);
            return discounts;
        } catch (error) {
            logger.error(`Error retrieving all discount: ${error.message}`, { error });
            throw new CustomError('Failed to retrieve discount.', 500);
        }
    }

    /**
     * Mendapatkan diskon berdasarkan ID.
     * @param {string} id
     * @returns {Promise<Discount>}
     */
    async getDiscountById(id) {
        try {
            const discount = await Discount.findByPk(id, {
                include: [
                    {
                        model: db.Product,
                        as: 'discountedProducts',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ]
            });
            if (!discount) {
                logger.warn(`Discount not found for ID: ${id}`);
                throw new CustomError('Discount not found.', 404);
            }
            logger.info(`Retrieved discount with ID: ${id}`);
            return discount;
        } catch (error) {
            logger.error(`Error retrieving discounf by ID ${id}: ${error.message}`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to retrieve discount.', 500);
        }
    }

    /**
     * Memperbarui diskon.
     * @param {string} id
     * @param {Object} updateData
     * @param {Array<string>} [productIds]
     * @returns {Promise<Discount>}
     */
    async updateDiscount(id, updateData, productIds = []) {
        const t = await db.sequelize.transaction();
        try {
            const discount = await Discount.findByPk(id, { transaction: t });
            if (!discount) {
                logger.warn(`Discount not found for update: ${id}`);
                throw new CustomError('Discount not found.', 404);
            }

            if (updateData.startDate || updateData.endDate) {
                const newStartDate = updateData.startDate ? new Date(updateData.startDate) : new Date(discount.startDate);
                const newEndDate = updateData.endDate ? new Date(updateData.endDate) : new Date(discount.endDate);
                if (newStartDate >= newEndDate) {
                    throw new CustomError('End date must be after start date.', 400);
                }
            }

            await discount.update(updateData, { transaction: t });
            logger.info(`Discount "${discount.name}" (ID: ${discount.id}) updated.`);

            if (discount.appliesTo === 'specific_products') {
                if (productIds && productIds.length > 0) {
                    const products = await Product.findAll({
                        where: { id: { [Op.in]: productIds } },
                        transaction: t
                    });

                    if (products.length !== productIds.length) {
                        throw new CustomError('One or more product IDs provided for specific discount are invalid.', 400);
                    }
                    await discount.setDiscountedProducts(products, { transaction: t });
                    logger.info(`Discount ${discount.id} specific products updated.`);
                } else {
                    await discount.setDiscountedProducts([], { transaction: t });
                    logger.warn(`Discount ${discount.id} applies to specific products but no product IDs provided. All related products removed.`);
                }
            } else {
                await discount.setDiscountedProducts([], { transaction: t });
            }
            await t.commit();
            return discount;
        } catch (error) {
            await t.rollback();
            logger.error(`Failed to update discounf ${id}: ${error.message}`, { error });

            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update discount due to an internal error.', 500);
        }
    }

    /**
     * Menghapus diskon.
     * @param {strin} id
     * @return {Promise<number>}
     */
    async deleteDiscount(id) {
        const t = await db.sequelize.transaction();
        try {
            const discount = await Discount.findByPk(id, { transaction: t });
            if (!discount) {
                logger.warn(`Discount not found for deletion: ${id}`);
                throw new CustomError('Discount not fount.', 404);
            }
            
            const deleteCount = await Discount.destroy({ where: { id: id }, transaction: t });

            await t.commit();
            logger.info(`Discount ${id} deleted successfully.`);
            return deleteCount;
        } catch (error) {
            await t.rollback();
            logger.error(`Failed to delete discount ${id}: ${error.message}`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to delete discount due to an internal error.', 500);
        }
    }

    /**
     * Mengambil diskon aktif yang berlaku saat ini.
     * Digunakan oleh service transaksi untuk menerapkan diskon.
     * @param {Array<string>} productIds
     * @returns {Promise<Array<Discount>>}
     */
    async getApplicableDiscounts(productIds) {
        const now = new Date();
        try {
            const getApplicableDiscounts = await Discount.findAll({
                where: {
                    isActive: true,
                    startDate: { [Op.lte]: now },
                    endDate: { [Op.gte]: now }
                },
                include: [
                    {
                        model: db.Product,
                        as: 'discountedProducts',
                        attributes: ['id'],
                        through: { attributes: [] }
                    }
                ]
            });

            return getApplicableDiscounts.filter(discount => {
                if (discount.appliesTo === 'all_products') {
                    return true;
                }

                const discountedProducts = discount.discountedProducts.map(p => p.id);
                return productIds.some(id => discountedProductsIds.includes(id));
            });
        } catch (error) {
            logger.error(`Error getting applicable discount: ${error.message}`, { error });
            throw new CustomError('Failed to retrieve applicable discounts.', 500);
        }
    }
}


module.exports = new DiscountService();