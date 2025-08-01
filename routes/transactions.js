// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, param } = require('express-validator');

// Validasi untuk membuat transaksi
const validateCreateTransaction = [
    body('paymentMethod').isIn(['Cash', 'Card', 'Transfer', 'QRIS', 'Other']).withMessage('Invalid payment method.'),
    body('discountAmount').optional().isDecimal({ decimal_places: '2' }).withMessage('Discount amount must be a valid decimal.').toFloat().isFloat({ min: 0 }).withMessage('Discount amount cannot be negative.'),
    body('items').isArray({ min: 1 }).withMessage('Transaction must have at least one item.'),
    body('items.*').custom((item, { req }) => {
        if (!item.productId && !item.barcode) {
            throw new Error('Each item must have either a productId or a barcode.');
        }
        if (item.productId && item.barcode) {
            throw new Error('Each item cannot have both productId and barcode. Choose one.');
        }
        return true;
    }),
    body('items.*.productId').optional().isUUID().withMessage('If provided, productId must be a valid UUID.'),
    body('items.*.barcode').optional().isString().trim().notEmpty().withMessage('If provided, barcode must be a non-empty string.'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity for each item must be a positive integer.'),
    body('items.*.priceType').isIn(['retail', 'wholesale']).withMessage('Invalid price type. Must be "retail" or "wholesale".')
];

const validateCompletePayment = [
    param('id').isUUID().withMessage('Invalid transaction ID.'),
    body('paymentMethod').optional().isIn(['Cash', 'Card', 'Transfer', 'QRIS', 'Other']).withMessage('Invalid payment method.')
];

// --- TRANSACTION ENDPOINTS ---
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'cashier'),
    validateCreateTransaction,
    transactionController.createTransaction
);

router.get(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'cashier'), // Kasir dan Admin bisa melihat semua transaksi
    transactionController.getAllTransactions
);

router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'cashier'), // Kasir dan Admin bisa melihat detail transaksi
    param('id').isUUID().withMessage('Invalid transaction ID'),
    transactionController.getTransactionById
);

router.put(
    '/:id/complete-payment', // Endpoint baru
    authenticateToken,
    authorizeRoles('admin', 'cashier'), // Admin dan Kasir bisa menyelesaikan pembayaran
    validateCompletePayment,
    transactionController.completeTransactionPayment
);


// Anda bisa menambahkan endpoint DELETE untuk Admin jika ada kebutuhan pembatalan transaksi total
// router.delete('/:id', authenticateToken, authorizeRoles('admin'), param('id').isUUID().withMessage('Invalid transaction ID'), transactionController.deleteTransaction);

module.exports = router;