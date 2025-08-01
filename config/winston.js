const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: 'debug'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            level: 'info',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
    ExceptionHandler: [
            new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
        ],
        rejectionHandlers: [
            new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
        ]
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message.trim());
    },
};

module.exports = logger;