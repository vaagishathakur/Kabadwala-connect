const sequelize = require('../config/database');

const Collector = require('./Collector');
const Material = require('./Material');
const Price = require('./Price');
const Recycler = require('./Recycler');
const Transaction = require('./Transaction');
const Traceability = require('./Traceability');
const IVRCall = require('./IVRCall');
const EPRLog = require('./EPRLog');

// Relationships
Collector.hasMany(Transaction, { foreignKey: 'collector_id' });
Transaction.belongsTo(Collector, { foreignKey: 'collector_id' });

Collector.hasMany(Material, { foreignKey: 'collector_id' });
Material.belongsTo(Collector, { foreignKey: 'collector_id' });

Recycler.hasMany(Transaction, { foreignKey: 'recycler_id' });
Transaction.belongsTo(Recycler, { foreignKey: 'recycler_id' });

Recycler.hasMany(Price, { foreignKey: 'recycler_id' });
Price.belongsTo(Recycler, { foreignKey: 'recycler_id' });

Transaction.hasOne(Traceability, { foreignKey: 'transaction_id' });
Traceability.belongsTo(Transaction, { foreignKey: 'transaction_id' });

Transaction.hasOne(EPRLog, { foreignKey: 'transaction_id' });
EPRLog.belongsTo(Transaction, { foreignKey: 'transaction_id' });

Recycler.hasMany(EPRLog, { foreignKey: 'recycler_id' });
EPRLog.belongsTo(Recycler, { foreignKey: 'recycler_id' });

Material.hasMany(EPRLog, { foreignKey: 'lot_id' });
EPRLog.belongsTo(Material, { foreignKey: 'lot_id' });

module.exports = {
  sequelize,
  Collector,
  Material,
  Price,
  Recycler,
  Transaction,
  Traceability,
  IVRCall,
  EPRLog,
};
