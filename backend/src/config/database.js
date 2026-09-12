const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const useSSL = process.env.DB_SSL === 'true';
const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'kabadconnect',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || 'postgres',
  isTest ? {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    dialectOptions: useSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  }
);

module.exports = sequelize;
