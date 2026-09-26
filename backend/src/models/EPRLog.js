// src/models/EPRLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EPRLog = sequelize.define('EPRLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lot_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  collector_anonymized_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'SHA-256 anonymized collector identifier for privacy compliance',
  },
  recycler_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  recycler_cpcb_reg_no: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'CPCB-REG-2024-MH-0042',
  },
  material_cpcb_code: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ITEW1',
    comment: 'CPCB E-Waste code: ITEW1-ITEW16, CEEW1-CEEW5',
  },
  material_category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  claimed_weight_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  confirmed_net_weight_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  purity_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100.0,
    allowNull: false,
  },
  payout_amount_inr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  gps_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  gps_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  handover_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  audit_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'Tamper-evident SHA-256 hash chaining transaction metadata',
  },
  payment_mode: {
    type: DataTypes.STRING,
    defaultValue: 'Cash',
  },
  upi_utr: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'epr_logs',
});

module.exports = EPRLog;
