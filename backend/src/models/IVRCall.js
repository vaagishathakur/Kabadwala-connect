const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IVRCall = sequelize.define('IVRCall', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  provider_call_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  caller_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  language: {
    type: DataTypes.ENUM('hi', 'mr', 'en'),
    defaultValue: 'hi',
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  menu_path: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  outcome: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = IVRCall;
