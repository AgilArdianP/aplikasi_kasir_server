const express = require('express');
const router = express.Router();


const authRoutes = require('./auth');
const userRoutes = require('./users'); // Akan kita buat nanti
const productRoutes = require('./products'); // Akan kita buat nanti
const categoryRoutes = require('./categories'); // Akan kita buat nanti
const discountRoutes = require('./discount');
const transactionRoutes = require('./transactions'); // Akan kita buat nanti
const reportRoutes = require('./reports'); // Akan kita buat nanti
const dashboardRoutes = require('./dashboard'); // Akan kita buat nanti

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/product', productRoutes);
router.use('/transaction', transactionRoutes);
router.use('/discount', discountRoutes);
router.use('/reports', reportRoutes);

module.exports = router;