// src/routes/prices.js
const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Price } = require('../models');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');

// Category metadata for price board icons
const CATEGORY_META = {
  CRT:     { icon_key: 'tv',            label_hi: 'पुराना टीवी',    label_mr: 'जुना टीव्ही'    },
  LCD:     { icon_key: 'monitor',       label_hi: 'एलसीडी स्क्रीन', label_mr: 'एलसीडी स्क्रीन' },
  PCB:     { icon_key: 'circuit',       label_hi: 'पीसीबी बोर्ड',   label_mr: 'पीसीबी बोर्ड'   },
  Cable:   { icon_key: 'cable',         label_hi: 'तार/केबल',        label_mr: 'तार/केबल'        },
  Battery: { icon_key: 'battery',       label_hi: 'बैटरी',           label_mr: 'बॅटरी'           },
  Motor:   { icon_key: 'motor',         label_hi: 'मोटर',            label_mr: 'मोटर'            },
  Plastic: { icon_key: 'plastic',       label_hi: 'प्लास्टिक',       label_mr: 'प्लास्टिक'       },
  Mixed:   { icon_key: 'mixed',         label_hi: 'मिश्रित',         label_mr: 'मिश्र'           },
  Other:   { icon_key: 'other',         label_hi: 'अन्य',            label_mr: 'इतर'             },
};

function getLikeOp() {
  return Price.sequelize && Price.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
}

/**
 * GET /prices/board
 * Price board for all categories with trend indicator
 */
router.get('/board', async (req, res, next) => {
  try {
    const { city = 'Mumbai' } = req.query;
    const likeOp = getLikeOp();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const categories = Object.keys(CATEGORY_META);
    const board = await Promise.all(
      categories.map(async (category) => {
        // Recent 7-day average
        const recentPrices = await Price.findAll({
          where: {
            material_category: category,
            location_city: { [likeOp]: `%${city}%` },
            date_recorded: { [Op.gte]: sevenDaysAgo },
          },
          attributes: ['buying_price_inr', 'market_range_low', 'market_range_high', 'date_recorded'],
          order: [['date_recorded', 'DESC']],
        });

        // Previous 7-14 day average for trend
        const prevPrices = await Price.findAll({
          where: {
            material_category: category,
            location_city: { [likeOp]: `%${city}%` },
            date_recorded: { [Op.between]: [fourteenDaysAgo, sevenDaysAgo] },
          },
          attributes: ['buying_price_inr'],
        });

        const recentAvg = recentPrices.length
          ? recentPrices.reduce((s, p) => s + parseFloat(p.buying_price_inr), 0) / recentPrices.length
          : null;
        const prevAvg = prevPrices.length
          ? prevPrices.reduce((s, p) => s + parseFloat(p.buying_price_inr), 0) / prevPrices.length
          : null;

        let trend = 'stable';
        let trend_pct = 0;
        if (recentAvg && prevAvg) {
          trend_pct = +((((recentAvg - prevAvg) / prevAvg) * 100).toFixed(1));
          if (trend_pct > 2) trend = 'up';
          else if (trend_pct < -2) trend = 'down';
        }

        const latestPrice = recentPrices[0];

        return {
          category,
          ...CATEGORY_META[category],
          avg_price_inr: recentAvg ? +recentAvg.toFixed(2) : null,
          unit: 'kg',
          trend,
          trend_pct,
          market_range: latestPrice
            ? { low: latestPrice.market_range_low, high: latestPrice.market_range_high }
            : null,
          last_updated: latestPrice ? latestPrice.date_recorded : null,
        };
      })
    );

    res.json({ success: true, city, prices: board, cached_at: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /prices/trend
 * 7-day daily average price trend for a category
 */
router.get('/trend', async (req, res, next) => {
  try {
    const { category, city = 'Mumbai', days = 7 } = req.query;
    if (!category) return res.status(400).json({ success: false, message: 'category required' });

    const likeOp = getLikeOp();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const prices = await Price.findAll({
      where: {
        material_category: category,
        location_city: { [likeOp]: `%${city}%` },
        date_recorded: { [Op.gte]: startDate },
      },
      attributes: ['date_recorded', 'buying_price_inr'],
      order: [['date_recorded', 'ASC']],
    });

    // Group by date
    const grouped = {};
    prices.forEach((p) => {
      const d = p.date_recorded ? p.date_recorded.toString().split('T')[0] : 'unknown';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(parseFloat(p.buying_price_inr));
    });

    const trend = Object.entries(grouped).map(([date, vals]) => ({
      date,
      avg_price: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
    }));

    res.json({ success: true, category, city, trend });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /prices
 * Query prices with filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, city, limit = 50, offset = 0 } = req.query;
    const likeOp = getLikeOp();
    const where = {};
    if (category) where.material_category = category;
    if (city) where.location_city = { [likeOp]: `%${city}%` };

    const prices = await Price.findAndCountAll({
      where,
      order: [['date_recorded', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ success: true, total: prices.count, prices: prices.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /prices
 * Add a price record (recycler or admin)
 */
router.post(
  '/',
  authenticate,
  [
    body('material_category').isIn(['CRT', 'LCD', 'PCB', 'Cable', 'Battery', 'Motor', 'Plastic', 'Mixed', 'Other']),
    body('buying_price_inr').isFloat({ min: 0.01 }),
    body('location_city').notEmpty(),
    body('location_state').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const price = await Price.create({
        id: uuidv4(),
        ...req.body,
        recycler_id: req.user.role === 'recycler' ? req.user.id : null,
        source: req.user.role === 'recycler' ? 'RecyclerSubmitted' : 'AdminEntered',
        date_recorded: req.body.date_recorded || new Date(),
      });

      res.status(201).json({ success: true, price });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
