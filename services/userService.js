const { User } = require('../models');
const { CustomError } = require('../utils/helpers');
const logger = require('../config/winston');

const userService = {
    /**
     * Mengambil profile pengguna berdasarkan ID.
     * @param {string} userId
     * @returns {Promise<object>}
     */
    async getUserProfile(userId) {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            throw new CustomError('User not found.', 404);
        }
        return user;
    },

    /**
     * Memperbarui profile pengguna.
     * @param {string} userId
     * @param {object} updateData
     * @returns {Promise<object>}
     */
    async updateUserProfile(userId, updateData) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new CustomError('User not found.', 404);
        }

        const allowedUpdates = ['username', 'email', 'address', 'profilePicture'];
        const updates = {};
        for (const key of allowedUpdates) {
            if (updateData.hasOwnProperty(key) && updateData[key] !== undefined &&updateData[key] !== null) {
                updates[key] = updateData[key];
            }
        }

        if (updates.username && updates.username !== user.username) {
            const existingUser = await User.findOne({ where: { username: updates.username } });
            if (existingUser) {
                throw new CustomError('Username already taken.', 409);
            }
        }
        if (updates.email && updates.email !== user.email) {
            const existingEmail = await User.findOne({ where: { email: updates.email } });
            if (existingEmail) {
                throw new CustomError('Email already registered.', 409);
            }
        }

        await user.update(updates);

        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        logger.info(`User profile updated: ${updatedUser.username} (${updatedUser.id})`);
        return updatedUser;
    },

    /**
     * Mengambil semua User. Hanya Admin
     * Dapat disaring berdasarkan peran atau status
     * @param {object} filters
     * @returns {Promise<Array<object>>}
     */
    async getAllUsers(filters = {}) {
        const whereClause = {};

        if (filters.role) {
            whereClause.role = filters.role;
        }
        if (filters.isActive !== undefined) {
            whereClause.isActive = filters.isActive;
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        logger.info(`Mengambil ${users.length} user dengan filter: ${JSON.stringify(filters)}`);
        return users;
    },

    /**
     * Menghapus User berdasarkan ID. Hanya Admin
     * @param {string} userId
     * @returns {Promise<number>}
     */
    async deleteUser(userId) {
        const userToDelete = await User.findByPk(userId);
        if (!userToDelete) {
            throw new CustomError('User not found.', 404);
        }
        if (userToDelete.role === 'admin' && userToDelete.id === loggedInAdminId) {
            throw new CustomError('Tidak bisa menghapus akun Admin.', 403);
        }

        const deleteCount = await User.destroy({
            where: { id: userId }
        });

        if (deleteCount === 0) {
            throw new CustomError('User not found.', 404);
        }

        logger.indo(`User berhasil dihapus: ${userId}`);
        return deleteCount;
    }
};

module.exports = userService;