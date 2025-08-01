const logger = require('../config/winston');
const { CustomError } = require('../utils/helpers');

const errorHandler = (err, req, res, next) => {
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        body: req.body,
        params: req.param
    });

    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof CustomError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err.name === 'ValidatioError') {
        statusCode = 400;
        message = err.details.map(d => d.message).join(', ');
    } else if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(', ');
    } else if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = `Duplicate entry: ${err.errors.map(e => e.message).join(', ')}`;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized: Invalid Token.';
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;