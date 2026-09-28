const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const useSSL = process.env.DB_SSL === 'true';
const isTest = process.env.NODE_ENV === 'test';

console.log('=== DATABASE ENV DEBUG ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_SSL:', process.env.DB_SSL);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('==========================');

let sequelize;

if (isTest) {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else if (process.env.DATABASE_URL) {
  // Use the full connection string if provided (e.g. from Render/Supabase)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    dialectOptions: useSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'kabadconnect',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      dialectOptions: useSSL
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    }
  );
}

module.exports = sequelize;
