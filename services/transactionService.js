const { Op } = require('sequelize');
const db = require('../models');
const Product = db.Product;
const Transaction = db.Transaction;
const TransactionItem = db.TransactionItem;
const { CustomError } = require('../utils/helpers'); 
const logger = require('../config/winston');
const discountService = require('./discountServicce');
const productService = require('./productService');

class TransactionService {
     /**
     * Membuat transaksi baru dengan status awal 'Pending' dan menerapkan diskon.
     * Item bisa diidentifikasi dengan productId atau barcode.
     * @param {Object} transactionData - Data transaksi utama (paymentMethod, discountAmount, cashierId, dll.)
     * @param {Array<Object>} items - Array produk yang dibeli ({ productId, barcode, quantity, priceType })
     * @returns {Promise<Transaction>} Transaksi yang berhasil dibuat
     */
    async createTransaction(transactionData, items) {
        let transaction;
        const t = await db.sequelize.transaction(); // Mulai transaksi database

        try {
            transactionData.transactionCode = `INV-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
            transactionData.paymentStatus = 'Pending';

            logger.info(`Attempting to create transaction (status Pending) for cashierId: ${transactionData.cashierId}`);
            
            // STEP 1: Identifikasi produk berdasarkan productId atau barcode, cek stok awal
            const processedItems = [];
            const productIdsInTransaction = new Set(); // Gunakan Set untuk ID unik

            for (const item of items) {
                let product;
                if (item.productId) {
                    product = await Product.findByPk(item.productId, { transaction: t });
                } else if (item.barcode) {
                    product = await Product.findOne({ where: { barcode: item.barcode }, transaction: t });
                } else {
                    throw new CustomError('Each item must have either a productId or a barcode.', 400);
                }

                if (!product) {
                    const identifier = item.productId || item.barcode;
                    logger.warn(`Product not found for identifier: ${identifier} during transaction creation.`);
                    throw new CustomError(`Product with ID/Barcode ${identifier} not found.`, 404);
                }
                if (product.stock < item.quantity) {
                    logger.warn(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                    throw new CustomError(`Not enough stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`, 400);
                }

                // Tambahkan ID produk ke Set untuk mencari diskon
                productIdsInTransaction.add(product.id);
                processedItems.push({ product, quantity: item.quantity, priceType: item.priceType });
            }

            // STEP 2: Dapatkan diskon yang berlaku (yang aktif dan sesuai tanggal)
            const applicableDiscounts = await discountService.getApplicableDiscounts(Array.from(productIdsInTransaction));
            logger.info(`Found ${applicableDiscounts.length} applicable discounts for this transaction.`);
            
            let transactionSpecificDiscounts = [];
            let transactionAllProductsDiscounts = null;

            applicableDiscounts.forEach(discount => {
                if (discount.appliesTo === 'specific_products') {
                    transactionSpecificDiscounts.push(discount);
                } else if (discount.appliesTo === 'all_products') {
                    if (!transactionAllProductsDiscounts || 
                        (discount.type === 'percentage' && (!transactionAllProductsDiscounts.value || discount.value > transactionAllProductsDiscounts.value)) ||
                        (discount.type === 'fixed_amount' && (!transactionAllProductsDiscounts.value || discount.value > transactionAllProductsDiscounts.value))) { // Pilih diskon fixed_amount terbesar juga
                        transactionAllProductsDiscounts = discount;
                    }
                }
            });

            transaction = await Transaction.create(transactionData, { transaction: t });
            logger.info(`Transaction ${transaction.id} created initially with status Pending.`);

            let totalAmountBeforeDiscount = 0;
            let totalItemDiscountApplied = 0;
            const transactionItemsToCreate = [];

            for (const item of processedItems) { // Gunakan processedItems
                const product = item.product; // Produk sudah didapatkan di STEP 1
                
                let priceToUse;
                if (item.priceType === 'wholesale') {
                    if (product.wholesalePrice === null || product.wholesalePrice === undefined) {
                        logger.warn(`Wholesale price not set for product ${product.name}. Falling back to retail price.`);
                        priceToUse = product.retailPrice;
                    } else {
                        priceToUse = product.wholesalePrice;
                    }
                } else {
                    priceToUse = product.retailPrice;
                }

                let itemSubtotal = priceToUse * item.quantity;
                let itemDiscount = 0;

                // Terapkan diskon spesifik produk terlebih dahulu
                for (const specificDiscount of transactionSpecificDiscounts) {
                    const discountedProductIds = specificDiscount.discountedProducts.map(p => p.id);
                    if (discountedProductIds.includes(product.id)) {
                        let currentItemDiscount = 0;
                        if (specificDiscount.type === 'percentage') {
                            currentItemDiscount = itemSubtotal * (specificDiscount.value / 100);
                        } else { // fixed_amount
                            currentItemDiscount = specificDiscount.value;
                        }
                        // Pastikan diskon tidak membuat harga item negatif
                        itemDiscount += Math.min(currentItemDiscount, itemSubtotal - itemDiscount); 
                    }
                }
                
                totalAmountBeforeDiscount += itemSubtotal;
                totalItemDiscountApplied += itemDiscount;

                transactionItemsToCreate.push({
                    transactionId: transaction.id,
                    productId: product.id,
                    quantity: item.quantity,
                    pricePerUnit: priceToUse,
                    priceType: item.priceType,
                    subtotal: itemSubtotal,
                    discountApplied: itemDiscount
                });

                // Kurangi stok produk
                await Product.update(
                    { stock: product.stock - item.quantity },
                    { where: { id: product.id }, transaction: t }
                );
                logger.info(`Stock for product ${product.name} (ID: ${product.id}) reduced by ${item.quantity}. New stock: ${product.stock - item.quantity}`);
            }

            await TransactionItem.bulkCreate(transactionItemsToCreate, { transaction: t });
            logger.info(`Transaction items for transaction ${transaction.id} created.`);

            let currentTotalAmount = totalAmountBeforeDiscount - totalItemDiscountApplied;
            let totalTransactionDiscount = totalItemDiscountApplied;

            // Terapkan diskon 'all_products' terakhir jika ada
            if (transactionAllProductsDiscounts) {
                let generalDiscountAmount = 0;
                if (transactionAllProductsDiscounts.type === 'percentage') {
                    generalDiscountAmount = currentTotalAmount * (transactionAllProductsDiscounts.value / 100);
                } else {
                    generalDiscountAmount = transactionAllProductsDiscounts.value;
                }
                generalDiscountAmount = Math.min(generalDiscountAmount, currentTotalAmount);
                currentTotalAmount -= generalDiscountAmount;
                totalTransactionDiscount += generalDiscountAmount;
            }

            const manualDiscount = transactionData.discountAmount || 0;
            currentTotalAmount -= manualDiscount;
            totalTransactionDiscount += manualDiscount;

            const finalAmount = Math.max(0, currentTotalAmount);

            await transaction.update({
                totalAmount: totalAmountBeforeDiscount,
                discountAmount: totalTransactionDiscount,
                finalAmount: finalAmount
            }, { transaction: t });

            await t.commit();
            logger.info(`Transaction ${transaction.id} successfully created with status Pending. Final amount: ${finalAmount}`);
            return transaction;

        } catch (error) {
            await t.rollback();
            logger.error(`Failed to create transaction: ${error.message}. Rolling back transaction.`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to create transaction due to an internal error.', 500);
        }
    }

    /**
     * Menyelesaikan pembayaran untuk transaksi yang statusnya 'Pending'.
     * @param {string} transactionId - ID Transaksi yang akan diselesaikan
     * @param {string} paymentMethod - Metode pembayaran yang digunakan (optional, jika ingin update)
     * @returns {Promise<Transaction>} Transaksi yang sudah update
     */
    async completeTransactionPayment(transactionId, paymentMethod = null) {
        const t = await db.sequelize.transaction();
        try {
            const transaction = await Transaction.findByPk(transactionId, { transaction: t });

            if (!transaction) {
                logger.warn(`Transaction not found for payment completion: ${transactionId}`);
                throw new CustomError('Transaction not found.', 404);
            }
            if (transaction.paymentStatus === 'Paid') {
                logger.warn(`Attempted to complete payment for already paid transaction: ${transactionId}`);
                throw new CustomError('Transaction has already been paid.', 400);
            }
            if (transaction.paymentStatus === 'Cancelled' || transaction.paymentStatus === 'Refunded') {
                logger.warn(`Attempted to complete payment for cancelled/refunded transaction: ${transactionId}`);
                throw new CustomError('Cannot complete payment for a cancelled or refunded transaction.', 400);
            }

            const updateData = { paymentStatus: 'Paid' };
            if (paymentMethod) {
                updateData.paymentMethod = paymentMethod;
            }

            await transaction.update(updateData, { transaction: t });
            await t.commit();
            logger.info(`Transaction ${transactionId} payment completed. Status set to Paid.`);
            return transaction;
        } catch (error) {
            await t.rollback();
            logger.error(`Failed to complete payment for transaction ${transactionId}: ${error.message}`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to complete transaction payment due to an internal error.', 500);
        }
    }

    /**
     * Mendapatkan semua transaksi.
     * @param {Object} filters - Filter untuk pencarian (misal: { cashierId, startDate, endDate })
     * @returns {Promise<Array<Transaction>>} Daftar transaksi
     */
    async getAllTransactions(filters) {
        const whereClause = {};
        if (filters.cashierId) {
            whereClause.cashierId = filters.cashierId;
        }
        if (filters.startDate && filters.endDate) {
            whereClause.transactionDate = {
                [Op.between]: [filters.startDate, filters.endDate]
            };
        }

        try {
            const transactions = await Transaction.findAll({
                where: whereClause,
                include: [
                    {
                        model: db.User,
                        as: 'cashier',
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: db.TransactionItem,
                        as: 'items',
                        include: [
                            {
                                model: db.Product,
                                as: 'product',
                                attributes: ['id', 'name', 'unit', 'retailPrice', 'wholesalePrice']
                            }
                        ]
                    }
                ],
                order: [['transactionDate', 'DESC']]
            });
            logger.info(`Retrieved ${transactions.length} transactions with filters: ${JSON.stringify(filters)}`);
            return transactions;
        } catch (error) {
            logger.error(`Error retrieving all transactions: ${error.message}`, { error });
            throw new CustomError('Failed to retrieve transactions.', 500);
        }
    }

    /**
     * Mendapatkan transaksi berdasarkan ID.
     * @param {string} id - ID transaksi
     * @returns {Promise<Transaction>} Transaksi yang ditemukan
     */
    async getTransactionById(id) {
        try {
            const transaction = await Transaction.findByPk(id, {
                include: [
                    {
                        model: db.User,
                        as: 'cashier',
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: db.TransactionItem,
                        as: 'items',
                        include: [
                            {
                                model: db.Product,
                                as: 'product',
                                attributes: ['id', 'name', 'unit', 'retailPrice', 'wholesalePrice']
                            }
                        ]
                    }
                ]
            });
            if (!transaction) {
                logger.warn(`Transaction not found for ID: ${id}`);
                throw new CustomError('Transaction not found.', 404);
            }
            logger.info(`Retrieved transaction with ID: ${id}`);
            return transaction;
        } catch (error) {
            logger.error(`Error retrieving transaction by ID ${id}: ${error.message}`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to retrieve transaction.', 500);
        }
    }
}

module.exports = new TransactionService();