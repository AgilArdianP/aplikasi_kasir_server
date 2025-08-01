const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query } = require('express-validator');

// Validasi untuk laporan produk terjual
const validateProductsSoldReport = [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date (YYYY-MM-DD).').toDate(),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date (YYYY-MM-DD).').toDate(),
    query('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID.'),
    query('productId').optional().isUUID().withMessage('Product ID must be a valid UUID.'),
    query('barcode').optional().isString().trim().notEmpty().withMessage('Barcode must be a non-empty string.')
];

// --- REPORT ENDPOINTS ---
router.get(
    '/products-sold',
    authenticateToken,
    authorizeRoles('admin'), // Hanya admin yang bisa melihat laporan
    validateProductsSoldReport,
    reportController.getProductsSoldReport
);

router.get( // <-- ROUTE BARU UNTUK LAPORAN MODAL STOK
    '/current-stock-modal',
    authenticateToken,
    authorizeRoles('admin'), // Hanya admin yang bisa melihat laporan modal
    reportController.getCurrentStockModalReport
);

// Router untuk laporan lainnya akan ditambahkan di sini

module.exports = router;