const { Sequelize } = require('sequelize');
const logger = require('./winston');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: (msg) => logger.debug(msg),
        define: {
            timestamps: true,
            underscored: true,
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
        console.log('Database connection established.');
    } catch (error) {
        logger.error('Unable to connect to the Database:', error);
        console.error('Unable to connect to the Database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };

connectDB();