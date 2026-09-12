const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lot_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: true,
  },
  collector_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('CRT', 'LCD', 'PCB', 'Cable', 'Battery', 'Motor', 'Plastic', 'Mixed', 'Other'),
    allowNull: false,
  },
  sub_category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_refs: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  approximate_weight_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  condition: {
    type: DataTypes.ENUM('Good', 'Damaged', 'Unknown'),
    defaultValue: 'Unknown',
  },
  source_type: {
    type: DataTypes.ENUM('Household', 'Commercial', 'Industrial'),
    allowNull: true,
  },
  estimated_value_inr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'ESTIMATED', 'MATCHED', 'HANDOVER_PENDING', 'VERIFIED', 'SETTLED'),
    defaultValue: 'DRAFT',
    allowNull: false,
  },
  cpcb_code: {
    type: DataTypes.STRING,
    defaultValue: 'ITEW1',
    allowNull: true,
  },
  qr_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  qr_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Material;
