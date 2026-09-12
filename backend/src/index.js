require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const lotRoutes = require('./routes/lots');
const priceRoutes = require('./routes/prices');
const recyclerRoutes = require('./routes/recyclers');
const handoverRoutes = require('./routes/handover');
const syncRoutes = require('./routes/sync');
const transactionRoutes = require('./routes/transactions');
const ivrRoutes = require('./routes/ivr');
const eprRoutes = require('./routes/epr');

const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/recyclers', recyclerRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ivr', ivrRoutes);
app.use('/api/epr', eprRoutes);

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  sequelize.sync({ alter: process.env.NODE_ENV !== 'production' })
    .then(() => {
      logger.info('Database connected and synced');
      app.listen(PORT, () => {
        logger.info(`KabadConnect API server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      logger.error('Failed to sync database: ' + err.message);
      process.exit(1);
    });
}

module.exports = app;
