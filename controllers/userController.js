const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');

const userController = {
    /**
     * Mengambil profil pengguna yang sedang login.
     * @param {object} req - Objek request Express.
     * @param {object} res - Objek response Express.
     */
    async getMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await userService.getUserProfile(userId);
            return successResponse(res, 'User profile fetched successfully.', user);
        } catch (error) {
            logger.error(`Error in userController.getMyProfile: ${error.message}`, { stack: error.stack });
            return errorResponse(res, error.message, error.statusCode);
        }
    },

    /**
     * Memperbarui profil pengguna yang sedang login.
     * @param {object} req - Objek request Express.
     * @param {object} res - Objek response Express.
     */
    async updateMyProfile(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        try {
            const userId = req.user.id; // ID pengguna dari token JWT
            const updateData = req.body;

            const updatedUser = await userService.updateUserProfile(userId, updateData);
            return successResponse(res, 'User profile updated successfully.', updatedUser);
        } catch (error) {
            logger.error(`Error in userController.updateMyProfile: ${error.message}`, { stack: error.stack, body: req.body, ip: req.ip, method: req.method, url: req.originalUrl });
            return errorResponse(res, error.message, error.statusCode);
        }
    },

    /**
     * Mengambil semua User. Hanya Admin
     * @param {object} req
     * @param {object} res
     */
    async getAllUsers(req, res) {
        try {
            const filters = req.query;
            const users = await userService.getAllUsers(filters);
            return successResponse(res, 'User berhasil diambil.', users);
        } catch (error) {
            logger.error(`Error in userController.getAllUsers: ${error.message}`, { stack: error.stack, query: req.query });
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    },

    /**
     * Menghapus User berdarkan ID. Hanya Admin
     * @param {object} req
     * @param {object} res
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            await userService.deleteUser(id);
            return successResponse(res, 'User berhasil dihapus.');
        } catch (error) {
            logger.error(`Error in userController.deleteUser: ${error.message}`, { stack: error.stack, params: req.params });
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    }
};

module.exports = userController;