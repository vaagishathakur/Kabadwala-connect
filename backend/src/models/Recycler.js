const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recycler = sequelize.define('Recycler', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  facility_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  materials_accepted: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  authorization_body: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  authorization_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  authorization_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  authorization_status: {
    type: DataTypes.ENUM('Active', 'Expired', 'Suspended'),
    defaultValue: 'Active',
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  offered_rates: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  pickup_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  service_area_km: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  last_verified: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Recycler;
