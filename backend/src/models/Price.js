const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Price = sequelize.define('Price', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  material_category: {
    type: DataTypes.ENUM('CRT', 'LCD', 'PCB', 'Cable', 'Battery', 'Motor', 'Plastic', 'Mixed', 'Other'),
    allowNull: false,
  },
  sub_category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location_city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location_state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date_recorded: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  buying_price_inr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  unit: {
    type: DataTypes.ENUM('kg', 'piece', 'tonne'),
    defaultValue: 'kg',
  },
  market_range_low: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  market_range_high: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  recycler_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  source: {
    type: DataTypes.ENUM('RecyclerSubmitted', 'AdminEntered', 'MarketScrape'),
    allowNull: false,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

module.exports = Price;
