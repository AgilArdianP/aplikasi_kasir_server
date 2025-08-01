const discountService = require('../services/discountServicce');
const { validationResult } = require('express-validator');
const { CustomError } = require('../utils/helpers');

exports.createDiscount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { productIds, ...discountData } = req.body;

    try {
        const newDiscount = await discountService.createDiscount(discountData, productIds);
        res.status(201).json({ success: true, message: 'Discount created successfully', data: newDiscount });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error creating discount:', error);
        res.status(500).json({ success: false, message: 'Failed to create discount.' });
    }
};

exports.getAllDiscounts = async (req, res) => {
    const filters = req.query;
    try {
        const discounts = await discountService.getAllDiscounts(filters);
        res.status(200).json({ success: true, message: 'Discounts retrieved successfully', data: discounts });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error getting all discount:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve discounts.' });
    }
};

exports.getDiscountById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }
    const { id } = req.params;
    try {
        const discount = await discountService.getDiscountById(id);
        res.status(200).json({ success: true, message: 'Discount retrieved successfully', data: discount });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error gettin discount by ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieved discount.' });
    }
};

exports.updateDiscount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { id } = req.params;
    const { productIds, ...updateData } = req.body;

    try {
        const updatedDiscount = await discountService.updateDiscount(id, updateData, productIds);
        res.status(200).json({ success: true, message: 'Discount updated successfully', data: this.updateDiscount });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error updating discount:', error);
        res.status(500).json({ success: false, message: 'Failed to update discount.' });
    }
};

exports.deleteDiscount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { id } = req.params;
    try {
        await discountService.deleteDiscount(id);
        res.status(200).json({ success: true, message: 'Discount deleted successfully.' });
    } catch (error) {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error deleting discount:', error);
        res.status(500).json({ success: false, message: 'Failed to delete discount.' });
    }
};
 