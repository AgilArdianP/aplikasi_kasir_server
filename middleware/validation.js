const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseFormatter');
const logger = require('../config/winston');

const validate = (validations) => {
    return async (req, res, next) => {
        for (let validation of validations) {
            await validation.run(req);
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        logger.warn('Validation errors detected:', errors.array());
        return errorResponse(res, 'Validation failed.', 400, errors.array());
    };
};

module.exports = { validate };