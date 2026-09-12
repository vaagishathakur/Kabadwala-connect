const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Collector = sequelize.define('Collector', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  preferred_language: {
    type: DataTypes.ENUM('hi', 'mr', 'en'),
    defaultValue: 'hi',
  },
  operating_city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  registration_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  total_transactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_earnings_inr: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
});

module.exports = Collector;
