// src/routes/recyclers.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Recycler, Material } = require('../models');
const { authenticate } = require('../middleware/auth');
const { matchRecyclers } = require('../services/matchRecycler');
const { haversineKm } = require('../utils/haversine');
const { Op } = require('sequelize');

/**
 * GET /recyclers
 * List recyclers with optional location + category filter
 */
router.get('/', async (req, res, next) => {
  try {
    const { lat, lng, category, radius_km = 100, limit = 20 } = req.query;

    const where = { authorization_status: 'Active' };
    if (category) {
      where.materials_accepted = { [Op.contains]: [category] };
    }

    const recyclers = await Recycler.findAll({ where, limit: parseInt(limit) });

    // If location provided, filter by distance and add distance field
    let result = recyclers;
    if (lat && lng) {
      const collectorLat = parseFloat(lat);
      const collectorLng = parseFloat(lng);
      const maxRadius = parseFloat(radius_km);

      result = recyclers
        .map((r) => ({
          ...r.toJSON(),
          distance_km: +haversineKm(collectorLat, collectorLng, r.lat, r.lng).toFixed(2),
        }))
        .filter((r) => r.distance_km <= maxRadius)
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    res.json({ success: true, recyclers: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /recyclers/match
 * Match and rank recyclers for a specific lot
 */
router.get('/match', authenticate, async (req, res, next) => {
  try {
    const { lot_id, collector_lat, collector_lng } = req.query;

    if (!lot_id || !collector_lat || !collector_lng) {
      return res.status(400).json({ success: false, message: 'lot_id, collector_lat, collector_lng required' });
    }

    const lot = await Material.findByPk(lot_id);
    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

    const recyclers = await Recycler.findAll({ where: { authorization_status: 'Active' } });
    const matched = matchRecyclers(lot, recyclers, parseFloat(collector_lat), parseFloat(collector_lng));

    res.json({ success: true, lot_id, matched_recyclers: matched });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /recyclers/:id
 * Get full recycler details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const recycler = await Recycler.findByPk(req.params.id);
    if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });
    res.json({ success: true, recycler });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /recyclers
 * Register a new recycler (admin only)
 */
router.post(
  '/',
  [
    body('name').notEmpty(),
    body('facility_address').notEmpty(),
    body('lat').isFloat({ min: 6, max: 37 }),
    body('lng').isFloat({ min: 68, max: 97 }),
    body('authorization_number').notEmpty(),
    body('contact_phone').isMobilePhone('any'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const recycler = await Recycler.create({ id: uuidv4(), ...req.body });
      res.status(201).json({ success: true, recycler });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /recyclers/:id
 * Update recycler rates or availability
 */
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const recycler = await Recycler.findByPk(req.params.id);
    if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });

    const allowed = ['offered_rates', 'pickup_available', 'service_area_km', 'contact_phone', 'materials_accepted'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await recycler.update(updates);
    res.json({ success: true, recycler });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
