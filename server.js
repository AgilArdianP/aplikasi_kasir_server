require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/winston');
const allRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Aplikasi Kasir Server is Running' });
});

app.use('/api', allRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Application Cashier Server running on port: ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;