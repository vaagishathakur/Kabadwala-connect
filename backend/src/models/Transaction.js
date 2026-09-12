const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lot_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  collector_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  recycler_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  material_category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total_weight_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quoted_price_inr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  final_price_inr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  collection_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  collection_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  handover_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  handover_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  collection_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  handover_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  payment_mode: {
    type: DataTypes.ENUM('Cash', 'UPI', 'Pending'),
    defaultValue: 'Pending',
  },
  payment_status: {
    type: DataTypes.ENUM('Paid', 'Pending', 'Disputed'),
    defaultValue: 'Pending',
  },
  transaction_status: {
    type: DataTypes.ENUM('Created', 'Matched', 'Confirmed', 'Completed', 'Cancelled'),
    defaultValue: 'Created',
  },
  anomaly_flag: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

module.exports = Transaction;
