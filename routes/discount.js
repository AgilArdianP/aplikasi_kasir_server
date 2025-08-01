const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Validasi untuk diskon
const validateDiscount = [
    body('name').notEmpty().withMessage('Discount name is required.'),
    body('type').isIn(['percentage', 'fixed_amount']).withMessage('Invalid discount type. Must be "percentage" or "fixed_amount".'),
    body('value').isDecimal({ decimal_places: '2' }).withMessage('Discount value must be a valid decimal.').toFloat().isFloat({ min: 0 }).withMessage('Discount value cannot be negative.'),
    body('appliesTo').isIn(['all_products', 'specific_products']).withMessage('Invalid appliesTo type. Must be "all_products" or "specific_products".'),
    body('startDate').isISO8601().toDate().withMessage('Start date must be a valid ISO 8601 date.'),
    body('endDate').isISO8601().toDate().withMessage('End date must be a valid ISO 8601 date.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
    body('productIds').optional().isArray().withMessage('Product IDs must be an array.'),
    body('productIds.*').optional().isUUID().withMessage('Each product ID must be a valid UUID.')
];

const validateUpdateDiscount = [
    body('name').optional().notEmpty().withMessage('Discount name cannot be empty.'),
    body('type').optional().isIn(['percentage', 'fixed_amount']).withMessage('Invalid discount type. Must be "percentage" or "fixed_amount".'),
    body('value').optional().isDecimal({ decimal_places: '2' }).withMessage('Discount value must be a valid decimal.').toFloat().isFloat({ min: 0 }).withMessage('Discount value cannot be negative.'),
    body('appliesTo').optional().isIn(['all_products', 'specific_products']).withMessage('Invalid appliesTo type. Must be "all_products" or "specific_products".'),
    body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO 8601 date.'),
    body('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO 8601 date.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
    body('productIds').optional().isArray().withMessage('Product IDs must be an array.'),
    body('productIds.*').optional().isUUID().withMessage('Each product ID must be a valid UUID.')
];

// --- DISCOUNT ENDPOINTS (Admin Only) ---
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    validateDiscount,
    discountController.createDiscount
);

router.get(
    '/',
    authenticateToken,
    authorizeRoles('admin'), // Admin bisa melihat semua diskon
    query('isActive').optional().isBoolean().withMessage('isActive filter must be boolean'),
    query('type').optional().isIn(['percentage', 'fixed_amount']).withMessage('Invalid type filter'),
    query('appliesTo').optional().isIn(['all_products', 'specific_products']).withMessage('Invalid appliesTo filter'),
    discountController.getAllDiscounts
);

router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    param('id').isUUID().withMessage('Invalid discount ID'),
    discountController.getDiscountById
);

router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    param('id').isUUID().withMessage('Invalid discount ID'),
    validateUpdateDiscount,
    discountController.updateDiscount
);

router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    param('id').isUUID().withMessage('Invalid discount ID'),
    discountController.deleteDiscount
);

module.exports = router;