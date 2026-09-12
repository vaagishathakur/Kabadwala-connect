// src/services/anomalyCheck.js
const { Price } = require('../models');
const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Check if a quoted price is anomalous compared to recent market data.
 * Uses z-score method: flags if |z| > 2.0
 *
 * @param {string} category - Material category enum
 * @param {string} location_city - City name
 * @param {number} quoted_price_inr - Price to check (INR/kg)
 * @returns {Promise<{is_anomaly, z_score, mean, stddev, expected_range}>}
 */
async function checkAnomaly(category, location_city, quoted_price_inr) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isPostgres = Price.sequelize && Price.sequelize.getDialect() === 'postgres';
    const cityOp = isPostgres ? Op.iLike : Op.like;

    const prices = await Price.findAll({
      where: {
        material_category: category,
        location_city: { [cityOp]: `%${location_city}%` },
        date_recorded: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: ['buying_price_inr'],
    });

    if (prices.length < 3) {
      // Not enough data to detect anomaly reliably
      return {
        is_anomaly: false,
        z_score: null,
        mean: null,
        stddev: null,
        expected_range: null,
        reason: 'insufficient_data',
      };
    }

    const values = prices.map((p) => parseFloat(p.buying_price_inr));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    const z_score = stddev > 0 ? (quoted_price_inr - mean) / stddev : 0;
    const is_anomaly = Math.abs(z_score) > 2.0;

    return {
      is_anomaly,
      z_score: +z_score.toFixed(3),
      mean: +mean.toFixed(2),
      stddev: +stddev.toFixed(2),
      expected_range: {
        low: +(mean - 2 * stddev).toFixed(2),
        high: +(mean + 2 * stddev).toFixed(2),
      },
      reason: is_anomaly ? 'price_outside_2sigma' : 'normal',
    };
  } catch (err) {
    logger.error(`anomalyCheck error: ${err.message}`);
    return { is_anomaly: false, z_score: null, mean: null, stddev: null, expected_range: null, reason: 'error' };
  }
}

module.exports = { checkAnomaly };
