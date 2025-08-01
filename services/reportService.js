const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const TransactionItem = db.TransactionItem;
const Product = db.Product;
const Transaction = db.Transaction;
const Category = db.Category;
const { CustomError } = require('../utils/helpers');
const logger = require('../config/winston');

class ReportService {
    /**
     * Mengambil laporan produk terjual dengan detail dan filter.
     * Termasuk total penjualan, biaya modal, laba, dan stok tersisa.
     * @param {Object} filters - Objek filter (startDate, endDate, categoryId, productId, barcode)
     * @returns {Promise<Array<Object>>} Array objek laporan produk
     */
    async getProductsSoldReport(filters) {
        const { startDate, endDate, categoryId, productId, barcode } = filters;
        const whereTransaction = {};
        const whereProduct = {};

        // Filter berdasarkan tanggal transaksi
        if (startDate && endDate) {
            whereTransaction.createdAt = {
                [Op.gte]: new Date(startDate),
                [Op.lte]: new Date(endDate)
            };
        } else if (startDate) {
            whereTransaction.createdAt = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            whereTransaction.createdAt = { [Op.lte]: new Date(endDate) };
        }

        // Filter produk berdasarkan kategori, ID produk, atau barcode
        if (categoryId) {
            whereProduct.categoryId = categoryId;
        }
        if (productId) {
            whereProduct.id = productId;
        }
        if (barcode) {
            whereProduct.barcode = barcode;
        }

        try {
            const reportData = await TransactionItem.findAll({
                attributes: [
                    'productId',
                    [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantitySold'],
                    [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'totalSalesRevenue'], // subtotal per item = pricePerUnit * quantity
                    [Sequelize.fn('SUM', Sequelize.col('discountApplied')), 'totalDiscountApplied']
                ],
                include: [
                    {
                        model: Transaction,
                        as: 'transaction',
                        attributes: [], // Hanya untuk filter, tidak perlu datanya
                        where: whereTransaction
                    },
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['name', 'barcode', 'unit', 'modalPrice', 'retailPrice', 'wholesalePrice', 'stock'], // Tambahkan stock
                        where: whereProduct,
                        include: [
                            {
                                model: Category,
                                as: 'category',
                                attributes: ['name']
                            }
                        ]
                    }
                ],
                group: [
                    'productId',
                    'product.id',
                    'product.name',
                    'product.barcode',
                    'product.unit',
                    'product.modalPrice',
                    'product.retailPrice',
                    'product.wholesalePrice',
                    'product.stock', // Pastikan semua kolom yang di SELECT juga di GROUP BY
                    'product->category.id', // Juga perlu group by product->category.id
                    'product->category.name' // Pastikan semua kolom yang di SELECT juga di GROUP BY
                ],
                order: [
                    [Sequelize.literal('totalQuantitySold'), 'DESC'] // <-- PERBAIKAN DI SINI
                ]
            });

            // Olah hasil untuk menghitung laba dan format data
            const formattedReport = reportData.map(item => {
                const product = item.product;
                const totalQuantitySold = parseFloat(item.dataValues.totalQuantitySold);
                const totalSalesRevenue = parseFloat(item.dataValues.totalSalesRevenue);
                const totalDiscountApplied = parseFloat(item.dataValues.totalDiscountApplied);

                const totalActualRevenue = totalSalesRevenue - totalDiscountApplied;
                const totalModalCost = parseFloat(product.modalPrice) * totalQuantitySold;
                const totalProfit = totalActualRevenue - totalModalCost;

                return {
                    productId: product.id,
                    productName: product.name,
                    barcode: product.barcode,
                    categoryName: product.category ? product.category.name : 'Uncategorized',
                    unit: product.unit,
                    currentStock: product.stock, // Stok yang tersisa saat laporan dibuat
                    modalPricePerUnit: parseFloat(product.modalPrice),
                    retailPricePerUnit: parseFloat(product.retailPrice),
                    wholesalePricePerUnit: product.wholesalePrice ? parseFloat(product.wholesalePrice) : null,
                    totalQuantitySold: totalQuantitySold,
                    totalSalesRevenue: totalSalesRevenue, // Total nilai penjualan sebelum diskon item (retail/wholesale price * qty)
                    totalDiscountApplied: totalDiscountApplied, // Total diskon yang diterapkan pada item ini
                    totalActualRevenue: totalActualRevenue, // Total pendapatan setelah diskon item
                    totalModalCost: totalModalCost, // Total biaya modal untuk item yang terjual
                    totalProfit: totalProfit, // Laba kotor dari item ini
                    profitMargin: totalActualRevenue > 0 ? (totalProfit / totalActualRevenue) * 100 : 0 // Margin laba
                };
            });

            logger.info(`Generated products sold report with ${formattedReport.length} items. Filters: ${JSON.stringify(filters)}`);
            return formattedReport;

        } catch (error) {
            logger.error(`Error generating products sold report: ${error.message}`, { filters, stack: error.stack });
            throw new CustomError('Failed to generate products sold report.', 500);
        }
    }

    /**
     * Menghitung total modal produk dari semua stok produk
     * Dapat juga menyertakan detail modal per produk
     * @returns {Promise<Object>}
     */
    async getCurrentStockModalReport() {
        try {
            const products = await Product.findAll({
                attributes: [
                    'id',
                    'name',
                    'barcode',
                    'unit',
                    'stock',
                    'modalPrice',
                    [Sequelize.literal('stock * modalPrice'), 'totalModalValuePerProduct']
                ],
                where: {
                    stock: {
                        [Op.gt]: 0
                    }
                },
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['name']
                    }
                ],
                order: [['name', 'ASC']]
            });

            let overallTotalModal = 0;
            const detailedProductModals = products.map(product => {
                const totalModalValuePerProduct = parseFloat(product.dataValues.totalModalValuePerProduct);
                overallTotalModal += totalModalValuePerProduct;

                return {
                    productId: product.id,
                    productName: product.name,
                    barcode: product.barcode,
                    categoryName: product.category ? product.category.name : 'Uncategorized',
                    unit: product.unit,
                    currentStock: product.stock,
                    modalPricePerUnit: parseFloat(product.modalPrice),
                    totalModalValue: totalModalValuePerProduct
                };
            });

            logger.info(`Generated current stock modal report. Overall total: ${overallTotalModal}`);

            return {
                overallTotalModal: overallTotalModal,
                detailedProductModals: detailedProductModals
            };
        } catch (error) {
            logger.error(`Error generating current stock modal report: ${error.message}`, { stack: error.stack });
            throw new CustomError('Failed to generate current stock modal report.', 500);
        }
    }
}

module.exports = new ReportService();