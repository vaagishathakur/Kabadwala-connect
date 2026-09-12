const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Traceability = sequelize.define('Traceability', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lot_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  photograph_refs: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  weight_at_handover_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  gps_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  gps_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  handover_reference: {
    type: DataTypes.STRING(8),
    allowNull: false,
    unique: true,
  },
  collector_signed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  recycler_confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  recycler_confirm_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  subsequent_status: {
    type: DataTypes.ENUM('Pending', 'ReceivedAtFacility', 'Processing', 'Completed'),
    defaultValue: 'Pending',
  }
}, {
  timestamps: true,
});

module.exports = Traceability;
