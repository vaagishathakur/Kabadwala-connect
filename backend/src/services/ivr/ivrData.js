const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Collector, Material, Price, Recycler, Transaction } = require('../../models');
const { estimateValue } = require('../priceEstimate');
const { matchRecyclers } = require('../matchRecycler');

const DEFAULT_CITY = process.env.IVR_DEFAULT_CITY || 'Pune';
const DEFAULT_LAT = parseFloat(process.env.IVR_DEFAULT_LAT || '18.6200');
const DEFAULT_LNG = parseFloat(process.env.IVR_DEFAULT_LNG || '73.8100');

function hashPhone(phone = 'anonymous') {
  const normalized = String(phone).replace(/[^\d+]/g, '') || 'anonymous';
  const salt = process.env.IVR_PHONE_HASH_SALT || process.env.JWT_SECRET || 'kabadconnect-dev-salt';
  return crypto.createHash('sha256').update(`${salt}:${normalized}`).digest('hex');
}

async function findOrCreateCollector(caller, preferredLanguage = 'hi') {
  const callerHash = hashPhone(caller);
  const [collector, created] = await Collector.findOrCreate({
    where: { phone_hash: callerHash },
    defaults: {
      id: uuidv4(),
      phone_hash: callerHash,
      preferred_language: preferredLanguage,
      operating_city: DEFAULT_CITY,
      registration_date: new Date(),
    },
  });

  return { collector, callerHash, created };
}

async function setCollectorLanguage(collectorId, language) {
  await Collector.update({ preferred_language: language }, { where: { id: collectorId } });
}

async function getPriceSummary(category, city = DEFAULT_CITY) {
  const estimate = await estimateValue(category, 1, city);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const isPostgres = Price.sequelize && Price.sequelize.getDialect() === 'postgres';
  const cityOp = isPostgres ? Op.iLike : Op.like;

  const recent = await Price.findAll({
    where: {
      material_category: category,
      location_city: { [cityOp]: `%${city}%` },
      date_recorded: { [Op.gte]: sevenDaysAgo },
    },
    order: [['date_recorded', 'DESC']],
    limit: 10,
  });

  const previous = await Price.findAll({
    where: {
      material_category: category,
      location_city: { [cityOp]: `%${city}%` },
      date_recorded: { [Op.between]: [fourteenDaysAgo, sevenDaysAgo] },
    },
    limit: 10,
  });

  const average = (rows) => rows.length
    ? rows.reduce((sum, row) => sum + parseFloat(row.buying_price_inr), 0) / rows.length
    : null;

  const recentAvg = average(recent);
  const previousAvg = average(previous);
  let trend = 'stable';
  if (recentAvg && previousAvg) {
    const diffPct = ((recentAvg - previousAvg) / previousAvg) * 100;
    if (diffPct > 2) trend = 'up';
    if (diffPct < -2) trend = 'down';
  }

  const latest = recent[0];
  return {
    category,
    city,
    avg_price_inr: recentAvg ? Math.round(recentAvg) : Math.round(estimate.price_per_kg),
    range_low: latest?.market_range_low ? Math.round(parseFloat(latest.market_range_low)) : Math.round(estimate.range.low),
    range_high: latest?.market_range_high ? Math.round(parseFloat(latest.market_range_high)) : Math.round(estimate.range.high),
    trend,
    confidence: estimate.confidence,
  };
}

async function estimateLot(category, weightKg, city = DEFAULT_CITY) {
  return estimateValue(category, weightKg, city);
}

async function createSellingLot({ collectorId, category, weightKg, city = DEFAULT_CITY }) {
  const estimate = await estimateLot(category, weightKg, city);
  const id = uuidv4();
  const lot = await Material.create({
    id,
    lot_id: id,
    collector_id: collectorId,
    category,
    description: `IVR request - ${category} - ${weightKg} kg`,
    image_refs: [],
    approximate_weight_kg: weightKg,
    condition: 'Unknown',
    source_type: 'Household',
    estimated_value_inr: estimate.estimated_value_inr,
  });

  return { lot, estimate };
}

async function getRankedRecyclers(category, collectorLat = DEFAULT_LAT, collectorLng = DEFAULT_LNG, limit = 3) {
  const recyclers = await Recycler.findAll({ where: { authorization_status: 'Active' } });
  const lot = { category };
  const ranked = matchRecyclers(lot, recyclers, collectorLat, collectorLng).slice(0, limit);
  if (ranked.length) return ranked;

  return [{
    id: 'demo-authorized-recycler',
    name: 'Demo Authorized Recycler',
    facility_address: 'Configured demo service area',
    authorization_status: 'Active',
    materials_accepted: [category],
    pickup_available: true,
    distance_km: 5,
    offered_rate_for_category: 0,
    contact_phone: null,
    match_score: 0,
    is_demo_fallback: true,
  }];
}

async function getTransactionSummary(collectorId) {
  const transactions = await Transaction.findAll({
    where: { collector_id: collectorId },
    order: [['collection_datetime', 'DESC']],
    limit: 5,
    include: [{ model: Recycler, as: 'Recycler', required: false }],
  }).catch(() => Transaction.findAll({
    where: { collector_id: collectorId },
    order: [['collection_datetime', 'DESC']],
    limit: 5,
  }));

  const all = await Transaction.findAll({
    where: { collector_id: collectorId },
    attributes: ['final_price_inr', 'quoted_price_inr', 'payment_status', 'transaction_status'],
  });

  const paid = all
    .filter((tx) => tx.payment_status === 'Paid')
    .reduce((sum, tx) => sum + parseFloat(tx.final_price_inr || tx.quoted_price_inr || 0), 0);
  const pending = all
    .filter((tx) => tx.payment_status === 'Pending' && tx.transaction_status !== 'Cancelled')
    .reduce((sum, tx) => sum + parseFloat(tx.quoted_price_inr || 0), 0);

  return { transactions, totalEarned: Math.round(paid), totalPending: Math.round(pending) };
}

async function findLotByDigits(collectorId, digits) {
  const cleaned = String(digits || '').replace(/\D/g, '');
  const lots = await Material.findAll({
    where: { collector_id: collectorId },
    order: [['created_at', 'DESC']],
    limit: 30,
  });

  const lot = lots.find((item) => {
    const numericId = `${item.id || ''}${item.lot_id || ''}`.replace(/\D/g, '');
    return numericId.endsWith(cleaned);
  });

  if (!lot) return null;
  const transaction = await Transaction.findOne({
    where: { lot_id: lot.id },
    order: [['collection_datetime', 'DESC']],
  });
  return { lot, transaction };
}

module.exports = {
  DEFAULT_CITY,
  DEFAULT_LAT,
  DEFAULT_LNG,
  createSellingLot,
  estimateLot,
  findLotByDigits,
  findOrCreateCollector,
  getPriceSummary,
  getRankedRecyclers,
  getTransactionSummary,
  hashPhone,
  setCollectorLanguage,
};
