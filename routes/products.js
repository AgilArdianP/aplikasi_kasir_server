// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const uploadProductImage = require('../middleware/upload');
const { body, param } = require('express-validator');

// Validasi untuk Product
const validateProduct = [
    body('name').notEmpty().withMessage('Product name is required.'),
    body('modalPrice').isDecimal({ decimal_places: '2' }).withMessage('Modal price must be a valid decimal.').toFloat(),
    body('retailPrice').isDecimal({ decimal_places: '2' }).withMessage('Retail price must be a valid decimal.').toFloat(),
    body('wholesalePrice').optional().isDecimal({ decimal_places: '2' }).withMessage('Wholesale price must be a valid decimal.').toFloat(),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.').toInt(),
    body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID.'),
    body('unit').optional().isString().trim().notEmpty().withMessage('Unit cannot be empty if provided.'),
    body('barcode').optional().isString().trim().withMessage('Barcode must be a string.').isLength({ min: 1 }).withMessage('Barcode cannot be empty if provided.') // <-- VALIDASI BARCODE
];

const validateUpdateProduct = [
    body('name').optional().notEmpty().withMessage('Product name cannot be empty.'),
    body('modalPrice').optional().isDecimal({ decimal_places: '2' }).withMessage('Modal price must be a valid decimal.').toFloat(),
    body('retailPrice').optional().isDecimal({ decimal_places: '2' }).withMessage('Retail price must be a valid decimal.').toFloat(),
    body('wholesalePrice').optional().isDecimal({ decimal_places: '2' }).withMessage('Wholesale price must be a valid decimal.').toFloat(),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.').toInt(),
    body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID.'),
    body('unit').optional().isString().trim(),
    body('barcode').optional().isString().trim().withMessage('Barcode must be a string.').isLength({ min: 1 }).withMessage('Barcode cannot be empty if provided.') // <-- VALIDASI BARCODE
];

// Validasi untuk Category
const validateCategory = [
    body('name').notEmpty().withMessage('Category name is required.')
                .isString().withMessage('Category name must be a string')
                .trim(),
    body('description').optional().isString().withMessage('Description must be a string')
];
const validateUpdateCategory = [
    body('name').optional().notEmpty().withMessage('Category name cannot be empty.')
                .isString().withMessage('Category name must be a string')
                .trim(),
    body('description').optional().isString().withMessage('Description must be a string')
];

// --- CATEGORY ENDPOINTS ---
router.post('/categories', authenticateToken, authorizeRoles('admin'), validateCategory, productController.createCategory);
router.get('/categories', authenticateToken, authorizeRoles('admin', 'cashier'), productController.getAllCategories);
router.get('/categories/:id', authenticateToken, authorizeRoles('admin', 'cashier'), param('id').isUUID().withMessage('Invalid category ID'), productController.getCategoryById);
router.put('/categories/:id', authenticateToken, authorizeRoles('admin'), param('id').isUUID().withMessage('Invalid category ID'), validateUpdateCategory, productController.updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeRoles('admin'), param('id').isUUID().withMessage('Invalid category ID'), productController.deleteCategory);


// --- PRODUCT ENDPOINTS ---
router.post('/', authenticateToken, authorizeRoles('admin'), uploadProductImage, validateProduct, productController.createProduct);
router.get('/', authenticateToken, authorizeRoles('admin', 'cashier'), productController.getAllProducts);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'cashier'), param('id').isUUID().withMessage('Invalid product ID'), productController.getProductById);
router.get(
    '/barcode/:barcode',
    authenticateToken,
    authorizeRoles('admin', 'cashier'),
    param('barcode').isString().trim().notEmpty().withMessage('Barcode is required.'),
    productController.getProductByBarcode
);
router.put('/:id', authenticateToken, authorizeRoles('admin'), uploadProductImage, param('id').isUUID().withMessage('Invalid product ID'), validateUpdateProduct, productController.updateProduct);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), param('id').isUUID().withMessage('Invalid product ID'), productController.deleteProduct);


module.exports = router;