// src/services/priceEstimate.js
const { Price } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Fallback baseline prices when no DB data is available.
 */
const BASELINE_PRICES = {
  PCB:     { base: 100, low: 80,  high: 140 },
  Cable:   { base: 350, low: 280, high: 450 },
  Battery: { base: 30,  low: 15,  high: 50  },
  CRT:     { base: 10,  low: 5,   high: 18  },
  LCD:     { base: 45,  low: 30,  high: 70  },
  Motor:   { base: 60,  low: 40,  high: 90  },
  Plastic: { base: 12,  low: 5,   high: 22  },
  Mixed:   { base: 25,  low: 10,  high: 40  },
  Other:   { base: 20,  low: 10,  high: 35  },
};

/**
 * Estimate material value based on category, weight, and location.
 * @param {string} category - Material category enum
 * @param {number} weight_kg - Weight in kilograms
 * @param {string} location_city - City name
 * @returns {Promise<{estimated_value_inr, price_per_kg, range: {low, high}, confidence}>}
 */
async function estimateValue(category, weight_kg, location_city) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isPostgres = Price.sequelize.getDialect() === 'postgres';
    const cityOp = isPostgres ? Op.iLike : Op.like;

    // Try city-specific price first
    let prices = await Price.findAll({
      where: {
        material_category: category,
        location_city: { [cityOp]: location_city },
        date_recorded: { [Op.gte]: thirtyDaysAgo },
        is_verified: true,
      },
      order: [['date_recorded', 'DESC']],
      limit: 10,
    });

    // Fall back to any prices for this category
    if (!prices.length) {
      prices = await Price.findAll({
        where: {
          material_category: category,
          date_recorded: { [Op.gte]: thirtyDaysAgo },
        },
        order: [['date_recorded', 'DESC']],
        limit: 10,
      });
    }

    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, p) => sum + parseFloat(p.buying_price_inr), 0) / prices.length;
      const lowPrice = Math.min(...prices.map((p) => parseFloat(p.market_range_low || p.buying_price_inr)));
      const highPrice = Math.max(...prices.map((p) => parseFloat(p.market_range_high || p.buying_price_inr)));

      return {
        estimated_value_inr: +(avgPrice * weight_kg).toFixed(2),
        price_per_kg: +avgPrice.toFixed(2),
        range: {
          low: +(lowPrice * weight_kg).toFixed(2),
          high: +(highPrice * weight_kg).toFixed(2),
        },
        confidence: prices.length >= 5 ? 'high' : 'medium',
      };
    }

    // Fallback to baseline
    const baseline = BASELINE_PRICES[category] || BASELINE_PRICES.Other;
    return {
      estimated_value_inr: +(baseline.base * weight_kg).toFixed(2),
      price_per_kg: baseline.base,
      range: {
        low: +(baseline.low * weight_kg).toFixed(2),
        high: +(baseline.high * weight_kg).toFixed(2),
      },
      confidence: 'low',
    };
  } catch (err) {
    logger.error(`priceEstimate error: ${err.message}`);
    const baseline = BASELINE_PRICES[category] || BASELINE_PRICES.Other;
    return {
      estimated_value_inr: +(baseline.base * weight_kg).toFixed(2),
      price_per_kg: baseline.base,
      range: { low: +(baseline.low * weight_kg).toFixed(2), high: +(baseline.high * weight_kg).toFixed(2) },
      confidence: 'low',
    };
  }
}

module.exports = { estimateValue, BASELINE_PRICES };
