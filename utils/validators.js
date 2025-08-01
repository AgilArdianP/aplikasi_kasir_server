const { body } = require('express-validator');

const registerSchema = [
    body('username')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.')
        .trim()
        .escape(),
    body('email')
        .optional() 
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('role')
        .optional()
        .isIn(['admin', 'cashier']).withMessage('Role must be either "admin" or "cashier".')
];

const loginSchema = [
    body('username')
        .notEmpty().withMessage('Username is required.')
        .trim()
        .escape(),
    body('password')
        .notEmpty().withMessage('Password is required.')
];

const forgotPasswordSchema = [
    body('email')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail()
];

const resetPasswordSchema = [
    body('token')
        .notEmpty().withMessage('Reset token is required.'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
];

const editProfileSchema = [
    body('')
]


module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema
    
};