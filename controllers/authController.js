const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../config/winston');
const { CustomError } = require('../utils/helpers');

const authController = {
    register: async (req, res, next) => {
        try {
            const { username, email, password, role } = req.body;
            if (!username || !email) {
                throw new CustomError('Username and Email already exist.', 400);
            }
            const newUser = await authService.registerUser({ username, email, password, role });

            const { password: _, ...userData } = newUser.toJSON();

            successResponse(res, 'USer registered successfully!', userData, 201);
        } catch (error) {
            logger.error(`Error in authController.register: ${error.message}`, { stack: error.stack });
            next(error);
        }
    },

    login: async (req, res, next) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                throw new CustomError('Username and Password are required for login.', 400);
            }
            const { user, token, refreshToken } = await authService.loginUser(username, password);

            const { password: _, ...userData } = user.toJSON();

            successResponse(res, 'Login successfully!', { user: userData, token, refreshToken });
        } catch (error) {
            logger.error(`Error in authController.login: ${error.message}`, { stack: error.stack });
            next(error);
        }
    },

    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new new CustomError('Refresh token is required.', 400);
            }

            const { user, token, newRefreshToken } = await authService.refreshAccessToken(refreshToken);

            const { password: _, ...userData } = user.toJSON();

            successResponse(res, 'Token refreshed successfully!', { user: userData, token, refreshToken: newRefreshToken });
        } catch (error) {
            logger.error(`Error in authController.refreshToken: ${error.message}`, { stack: error.stack });
            next(error);
        }
    },

    logout: async (req, res, next) => {
        try {
            logger.info(`User ${req.user ? req.user.id : 'unknown'} logged out.`);
            successResponse(res, 'Logout successful!');
        } catch (error) {
            logger.error(`Error in authController.logout: ${error.message}`, { stack: error.stack });
            next(error);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!email) {
                throw new CustomError('Email is required.', 400);
            }
            await authService.requestPasswordReset(email);
            successResponse(res, 'Password reset link sent to your email (if registered)!');
        } catch (error) {
            logger.error(`Error in authController.forgotPassword: ${error.message}`, { stack: error.stack });
            next(error);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                throw new CustomError('Token and new password are required.', 400);
            }
            await authService.resetUserPassword(token, newPassword);
            successResponse(res, 'Password has been reset successfully!');
        } catch (error) {
            logger.error(`Error in authController.resetPassword: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }
};

module.exports = authController;