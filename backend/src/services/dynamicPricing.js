// src/services/dynamicPricing.js
const { Price, Transaction } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const BASELINE_RATES = {
  PCB: 110,
  CRT: 25,
  LCD: 45,
  Cable: 180,
  Battery: 85,
  Motor: 70,
  Plastic: 18,
  Mixed: 50,
  Other: 35,
};

/**
 * Record a new price point from a confirmed transaction and update rolling VWAP
 */
async function recordTransactionPrice(category, city = 'Mumbai', ratePerKg, weightKg) {
  try {
    if (!ratePerKg || ratePerKg <= 0 || !category) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute volume-weighted average price (VWAP) over last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const txns = await Transaction.findAll({
      where: {
        material_category: category,
        transaction_status: 'Completed',
        handover_datetime: { [Op.gte]: fourteenDaysAgo },
      },
      attributes: ['final_price_inr', 'total_weight_kg'],
    });

    let totalVal = parseFloat(ratePerKg) * parseFloat(weightKg || 1);
    let totalWt = parseFloat(weightKg || 1);

    for (const t of txns) {
      const p = parseFloat(t.final_price_inr || 0);
      const w = parseFloat(t.total_weight_kg || 0);
      if (p > 0 && w > 0) {
        totalVal += p;
        totalWt += w;
      }
    }

    const vwap = +(totalVal / totalWt).toFixed(2);
    const lowRange = +(vwap * 0.90).toFixed(2);
    const highRange = +(vwap * 1.15).toFixed(2);

    // Upsert or create price entry
    const [priceRecord, created] = await Price.findOrCreate({
      where: {
        material_category: category,
        location_city: city,
        date_recorded: today,
      },
      defaults: {
        material_category: category,
        location_city: city,
        location_state: 'Maharashtra',
        buying_price_inr: vwap,
        market_range_low: lowRange,
        market_range_high: highRange,
        date_recorded: today,
        source_type: 'Transaction_VWAP',
      },
    });

    if (!created) {
      await priceRecord.update({
        buying_price_inr: vwap,
        market_range_low: lowRange,
        market_range_high: highRange,
        source_type: 'Transaction_VWAP',
      });
    }

    logger.info(`Dynamic Price updated for ${category} in ${city}: ₹${vwap}/kg (VWAP from ${txns.length + 1} transactions)`);
    return { category, city, vwap, lowRange, highRange };
  } catch (err) {
    logger.error('Failed to update dynamic price: ' + err.message);
    return null;
  }
}

/**
 * Get dynamic prices for all categories reflecting recent transactions
 */
async function getDynamicCategoryPrices(city = 'Mumbai') {
  const categories = Object.keys(BASELINE_RATES);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const results = await Promise.all(
    categories.map(async (category) => {
      // 1. Check recent completed transactions (highest fidelity ground-truth)
      const recentTx = await Transaction.findAll({
        where: {
          material_category: category,
          transaction_status: 'Completed',
          handover_datetime: { [Op.gte]: sevenDaysAgo },
        },
        attributes: ['final_price_inr', 'total_weight_kg', 'handover_datetime'],
        order: [['handover_datetime', 'DESC']],
      });

      const prevTx = await Transaction.findAll({
        where: {
          material_category: category,
          transaction_status: 'Completed',
          handover_datetime: { [Op.between]: [fourteenDaysAgo, sevenDaysAgo] },
        },
        attributes: ['final_price_inr', 'total_weight_kg'],
      });

      let currentPrice = null;
      let rangeLow = null;
      let rangeHigh = null;
      let lastUpdated = null;
      let source = 'Base';

      if (recentTx.length > 0) {
        let valSum = 0;
        let wtSum = 0;
        for (const t of recentTx) {
          valSum += parseFloat(t.final_price_inr || 0);
          wtSum += parseFloat(t.total_weight_kg || 0);
        }
        if (wtSum > 0) {
          currentPrice = +(valSum / wtSum).toFixed(2);
          rangeLow = +(currentPrice * 0.90).toFixed(2);
          rangeHigh = +(currentPrice * 1.15).toFixed(2);
          lastUpdated = recentTx[0].handover_datetime;
          source = 'Live_Transactions';
        }
      }

      // 2. If no recent transactions, look in Price table
      if (!currentPrice) {
        const dbPrice = await Price.findOne({
          where: { material_category: category },
          order: [['date_recorded', 'DESC']],
        });
        if (dbPrice) {
          currentPrice = parseFloat(dbPrice.buying_price_inr);
          rangeLow = parseFloat(dbPrice.market_range_low || currentPrice * 0.9);
          rangeHigh = parseFloat(dbPrice.market_range_high || currentPrice * 1.15);
          lastUpdated = dbPrice.date_recorded;
          source = dbPrice.source_type || 'Price_Table';
        }
      }

      // 3. Fallback to baseline rate
      if (!currentPrice) {
        currentPrice = BASELINE_RATES[category] || 50;
        rangeLow = +(currentPrice * 0.88).toFixed(2);
        rangeHigh = +(currentPrice * 1.12).toFixed(2);
        lastUpdated = new Date();
      }

      // Trend calculation
      let trend = 'stable';
      let trend_pct = 0;
      if (prevTx.length > 0 && currentPrice) {
        const prevAvg = prevTx.reduce((s, t) => s + (parseFloat(t.final_price_inr) / (parseFloat(t.total_weight_kg) || 1)), 0) / prevTx.length;
        if (prevAvg > 0) {
          trend_pct = +((((currentPrice - prevAvg) / prevAvg) * 100).toFixed(1));
          if (trend_pct > 1.5) trend = 'up';
          else if (trend_pct < -1.5) trend = 'down';
        }
      }

      return {
        category,
        current_price_inr: currentPrice,
        market_range_low: rangeLow,
        market_range_high: rangeHigh,
        price_trend: trend,
        trend_percentage: trend_pct,
        last_updated: lastUpdated,
        pricing_source: source,
      };
    })
  );

  return results;
}

module.exports = {
  recordTransactionPrice,
  getDynamicCategoryPrices,
  BASELINE_RATES,
};
