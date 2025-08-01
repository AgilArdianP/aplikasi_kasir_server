const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../config/winston');
const db = require('../models');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Authentication attempt without token.');
        return errorResponse(res, 'Access Token required.', 401); // 401 Unauthorized
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await db.User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'role', 'isActive'] // Hanya ambil data penting
        });

        if (!user) {
            logger.warn(`User not found for ID from token: ${decoded.id}`);
            return errorResponse(res, 'User not found.', 401); // User tidak ditemukan
        }

        if (!user.isActive) {
            logger.warn(`Inactive user tried to access: ${user.username} (${user.id})`);
            return errorResponse(res, 'Account is inactive. Please contact administrator.', 403); // 403 Forbidden
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error(`Token verification failed: ${error.message}`, { stack: error.stack });
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Access Token expired.', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Invalid Access Token.', 401);
        }
        return errorResponse(res, 'Failed to authenticate token.', 401);
    }
};


const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logger.warn(`User ${req.user ? req.user.username : 'unknown'} tried to access unauthorized resource. Required roles: ${roles.join(', ')}. User role: ${req.user ? req.user.role : 'none'}`);
            return errorResponse(res, 'You do not have permission to perform this action.', 403); // 403 Forbidden
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};