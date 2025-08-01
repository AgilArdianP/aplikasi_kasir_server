const reportService = require('../services/reportService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');
const { CustomError } = require('../utils/helpers');

const reportController = {
    /**
     * Mengambil laporan produk terjual
     * Filter dapat mencakup startDate, endDate, categoryId, productId, dan barcode
     */
    async getProductsSoldReport(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validation errors for getProductsSoldReport:', { errors: errors.array(), query: req.query });
            return errorResponse(res, 'Validation failed.', 400, errors.array());
        }

        const filters = req.query;

        try {
            const report = await reportService.getProductsSoldReport(filters);
            return successResponse(res, 'Products sold report generated successfully.', report);
        } catch (error) {
            logger.error(`Error in getProductsSoldReport controller: ${error.message}`, { stack: error.stack, query: req.query });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to generate products sold report.', 500);
        }
    },

    async getCurrentStockModalReport(req, res) {
        try {
            const report = await reportService.getCurrentStockModalReport();
            return successResponse(res, 'Current stock modal report generated successfully.', report);
        } catch (error) {
            logger.error(`Error in getCurrentStockModalReport controller: ${error.message}`, { stack: error.stack });
            if (error instanceof CustomError) {
                return errorResponse(res, error.message, error.statusCode);
            }
            return errorResponse(res, 'Failed to generate current stock modal report.', 500);
        }
    },
    
};

module.exports = reportController;
