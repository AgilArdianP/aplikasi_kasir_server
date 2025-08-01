// services/authService.js
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/jwt'); // Menggunakan config/jwt untuk secret/expiresIn Access Token
const logger = require('../config/winston');
const { CustomError } = require('../utils/helpers');
const db = require('../models'); // Mengimpor semua model dari index.js
const User = db.User;
const RefreshToken = db.RefreshToken; // <-- TAMBAHKAN INI: Impor model RefreshToken
const { Op } = require('sequelize');

// HAPUS BARIS INI: const { refreshToken } = require('../controllers/authController');

const authService = {
    /**
     * Register User baru.
     * @param {Object} userData - User data (username, email, password, role)
     * @returns {Promise<User>} The created user object
     */
    registerUser: async (userData) => {
        const { username, email, password, role } = userData;
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username: username }, { email: email }]
            }
        });

        if (existingUser) {
            if (existingUser.username === username) {
                throw new CustomError('Username already taken.', 409);
            }
            if (existingUser.email === email) {
                throw new CustomError('Email already registered.', 409);
            }
        }

        try {
            const newUser = await User.create({ username, email, password, role });
            logger.info(`New user registered: ${newUser.username} (${newUser.id})`);
            return newUser;
        } catch (error) {
            logger.error(`Error registering user: ${error.message}`, { stack: error.stack });
            throw new CustomError('Failed to register user. Please try again.', 500);
        }
    },

    /**
     * Logs in dan generate token
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Object>}
     */
    loginUser: async (username, password) => {
        const user = await User.unscoped().findOne({
            where: { username: username }
        });

        if (!user || !(await user.comparePassword(password))) {
            throw new CustomError('Invalid credentials.', 401);
        }

        if (!user.isActive) {
            throw new CustomError('Your account is inactive. Please contact administrator.', 403);
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET, // Menggunakan JWT_SECRET dari .env
            { expiresIn: process.env.JWT_EXPIRES_IN } // Menggunakan JWT_EXPIRES_IN dari .env
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET, // <-- GUNAKAN JWT_REFRESH_SECRET
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } // <-- GUNAKAN JWT_REFRESH_EXPIRES_IN
        );

        // --- TAMBAHKAN LOGIKA PENYIMPANAN REFRESH TOKEN KE DB ---
        const refreshTokenExpiresAt = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN_MS, 10));
        await RefreshToken.create({
            token: refreshToken,
            userId: user.id,
            expiresAt: refreshTokenExpiresAt
        });
        // --- AKHIR PENAMBAHAN ---

        logger.info(`User logged in: ${user.username} (${user.id})`);
        return { user, token, refreshToken };
    },

    /**
     * Refresh expired menggunakan token refresh
     * @param {string} refreshTokenString - Nama parameter diubah agar tidak bentrok dengan fungsi
     * @returns {Promise<Object>}
     */
    refreshAccessToken: async (refreshTokenString) => { // <-- Ubah nama parameter
        if (!refreshTokenString) {
            throw new CustomError('Refresh token is missing.', 400);
        }
        try {
            const decoded = jwt.verify(refreshTokenString, process.env.JWT_REFRESH_SECRET); // <-- GUNAKAN JWT_REFRESH_SECRET

            // Cari refresh token di database
            const storedRefreshToken = await RefreshToken.findOne({
                where: {
                    token: refreshTokenString,
                    userId: decoded.id,
                    expiresAt: { [Op.gt]: new Date() } // Pastikan belum kedaluwarsa
                }
            });

            if (!storedRefreshToken) {
                throw new CustomError('Invalid or expired Refresh Token.', 401);
            }

            const user = await User.findByPk(decoded.id);

            if (!user || !user.isActive) {
                throw new CustomError('Invalid or inactive user.', 401);
            }

            const newToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET, // Menggunakan JWT_SECRET dari .env
                { expiresIn: process.env.JWT_EXPIRES_IN } // Menggunakan JWT_EXPIRES_IN dari .env
            );

            const newRefreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET, // <-- GUNAKAN JWT_REFRESH_SECRET
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } // <-- GUNAKAN JWT_REFRESH_EXPIRES_IN
            );

            // --- HAPUS REFRESH TOKEN LAMA DAN SIMPAN YANG BARU ---
            await storedRefreshToken.destroy(); // Hapus token lama dari DB

            const newRefreshTokenExpiresAt = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN_MS, 10));
            await RefreshToken.create({
                token: newRefreshToken,
                userId: user.id,
                expiresAt: newRefreshTokenExpiresAt
            });
            // --- AKHIR PERBARUAN ---

            logger.info(`Token refreshed for user: ${user.username} (${user.id})`);
            return { user, token: newToken, newRefreshToken }
        } catch (error) {
            logger.error(`Error refreshing token: ${error.message}`, { stack: error.stack });
            if (error.name === 'TokenExpiredError') {
                throw new CustomError('Refresh token expired. Please login again.', 401);
            }
            throw new CustomError('Invalid refresh Token.', 401);
        }
    },
    /**
     * Handle lupa password
     * @param {string} email
     */
    requestPasswordReset: async (email) => {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            logger.warn(`Forgot password attempt for unregistered email: ${email}`);
            return;
        }

        const resetToken = jwt.sign({ id: user.id}, process.env.JWT_SECRET, { expiresIn: '1h' }); // Menggunakan JWT_SECRET untuk reset token

        // TODO:
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        logger.info(`Password reset link for ${user.email}: ${resetLink}`);

        logger.info(`Password reset requested for user: ${user.email}`);
    },

    /**
     * Reset user password using valid token.
     * @param {string} token
     * @param {string} newPassword
     */
    resetUserPassword: async (token, newPassword) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Menggunakan JWT_SECRET untuk verifikasi reset token
            const user = await User.findByPk(decoded.id);

            if (!user) {
                throw new CustomError('Invalid or Expired reset password token.', 400);
            }

            user.password = newPassword;
            await user.save();
            logger.info(`Password reset for user: ${user.username} (${user.id})`);
        } catch (error) {
            logger.error(`Error resetting password: ${error.message}`, { stack: error.stack });
            if (error.name === 'TokenExpiredError') {
                throw new CustomError('Password reset token expired. Please request a new one.', 400);
            }
            throw new CustomError('Failed to reset Password. Please Try Again.', 500)
        }
    },

    /**
     * Melakukan logout pengguna dengan menghapus refresh token.
     * @param {string} userId - ID pengguna yang logout.
     * @param {string} refreshTokenString - Refresh token yang akan dihapus.
     * @returns {Promise<void>}
     */
    logoutUser: async (userId, refreshTokenString) => { // <-- Tambahkan `=> { ... }` untuk implementasi
        // Cari dan hapus refresh token dari database
        const deletedCount = await RefreshToken.destroy({
            where: {
                userId: userId,
                token: refreshTokenString
            }
        });

        if (deletedCount === 0) {
            logger.warn(`Logout attempt for user ${userId} with non-existent or invalid refresh token.`);
            // Kita tidak throw error di sini agar response ke user tetap sukses,
            // meskipun tokennya mungkin sudah tidak ada di DB (misal sudah logout sebelumnya)
        }

        logger.info(`User ${userId} logged out. Refresh token deleted.`);
    }
};

module.exports = authService;