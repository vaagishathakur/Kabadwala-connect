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
const notificationRoutes = require('./routes/notifications');

const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../uploads');
const lotsUploadDir = path.join(uploadsDir, 'lots');
const curatedUploadDir = path.join(uploadsDir, 'curated');
[lotsUploadDir, curatedUploadDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

app.use('/uploads', express.static(uploadsDir));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
});

// Ground-Truth Dataset Pipeline Stats
const { getDatasetStats } = require('./services/curationPipeline');
app.get(['/dataset/stats', '/api/dataset/stats'], (req, res) => {
  res.json({ success: true, ...getDatasetStats() });
});

// API Routes (supports both /api/* and root /* for seamless compatibility)
const routeMap = [
  ['/auth', authRoutes],
  ['/lots', lotRoutes],
  ['/prices', priceRoutes],
  ['/recyclers', recyclerRoutes],
  ['/handover', handoverRoutes],
  ['/sync', syncRoutes],
  ['/transactions', transactionRoutes],
  ['/ivr', ivrRoutes],
  ['/epr', eprRoutes],
  ['/notifications', notificationRoutes],
];

routeMap.forEach(([routePath, handler]) => {
  app.use(`/api${routePath}`, handler);
  app.use(routePath, handler);
});

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      logger.info('Database connected successfully');
      app.listen(PORT, () => {
        logger.info(`KabadConnect API server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      logger.error('Failed to connect to database: ' + err.message);
      process.exit(1);
    });
}

module.exports = app;
