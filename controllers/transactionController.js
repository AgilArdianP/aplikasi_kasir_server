// controllers/transactionController.js (VERSI TERBARU DENGAN CUSTOM ERROR HANDLING)
const transactionService = require('../services/transactionService');
const { validationResult } = require('express-validator');
const { CustomError } = require('../utils/helpers'); // Pastikan path ini benar

exports.createTransaction = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { paymentMethod, discountAmount, items } = req.body;
    const cashierId = req.user.id; // ID pengguna dari token (kasir yang sedang login)

    try {
        const transactionData = { paymentMethod, discountAmount, cashierId };
        const newTransaction = await transactionService.createTransaction(transactionData, items);
        res.status(201).json({ success: true, message: 'Transaction created successfully', data: newTransaction });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error creating transaction:', error);
        res.status(500).json({ success: false, message: 'Failed to create transaction due to an internal server error.' });
    }
};

exports.getAllTransactions = async (req, res) => {
    const filters = req.query;
    try {
        const transactions = await transactionService.getAllTransactions(filters);
        res.status(200).json({ success: true, message: 'Transactions retrieved successfully', data: transactions });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error getting all transactions:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
    }
};

exports.getTransactionById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { id } = req.params;
    try {
        const transaction = await transactionService.getTransactionById(id);
        res.status(200).json({ success: true, message: 'Transaction retrieved successfully', data: transaction });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error getting transaction by ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve transaction.' });
    }
};

exports.completeTransactionPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { id } = req.params;
    const { paymentMethod } = req.body; // paymentMethod opsional, bisa diupdate jika perlu

    try {
        const updatedTransaction = await transactionService.completeTransactionPayment(id, paymentMethod);
        res.status(200).json({ success: true, message: 'Transaction payment completed successfully', data: updatedTransaction });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error completing transaction payment:', error);
        res.status(500).json({ success: false, message: 'Failed to complete transaction payment.' });
    }
};