const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, param } = require('express-validator');

const validateUpdateProfile = [
    body('username')
        .optional()
        .isString().withMessage('Username must be a string')
        .trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email')
        .optional()
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('address')
        .optional()
        .isString().withMessage('Address must be a string')
        .trim(),
    body('profilePicture')
        .optional()
        .isURL().withMessage('Profile picture must be a valid URL')
        .trim()
];

router.get('/profile', authenticateToken, userController.getMyProfile);

router.put('/profile', authenticateToken, validateUpdateProfile, userController.updateMyProfile);


const validateDeleteUser = [
    param('id').isUUID().withMessage('User ID must be a valid UUID')
];

router.get('/', authenticateToken, authorizeRoles('admin'), userController.getAllUsers);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), validateDeleteUser, userController.deleteUser);


module.exports = router;