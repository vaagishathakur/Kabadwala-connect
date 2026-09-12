// src/routes/sync.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Material, Transaction, Traceability, Price, Recycler } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * POST /sync
 * Batch sync endpoint for offline-first mobile clients.
 *
 * Accepts an array of changes from the device, applies them idempotently,
 * then returns server-side updates since last_sync_time.
 *
 * Body: { collector_id, last_sync_time, changes: [{entity, action, data, client_timestamp}] }
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { collector_id, last_sync_time, changes = [] } = req.body;
    const results = { applied: 0, failed: 0, errors: [] };

    // Apply client changes
    for (const change of changes) {
      try {
        const { entity, action, data, client_timestamp } = change;

        switch (entity) {
          case 'lot': {
            if (action === 'create' || action === 'upsert') {
              await Material.upsert({
                ...data,
                collector_id: req.user.id, // Always enforce authenticated collector
              });
            } else if (action === 'update') {
              await Material.update(data, { where: { id: data.id, collector_id: req.user.id } });
            } else if (action === 'delete') {
              await Material.destroy({ where: { id: data.id, collector_id: req.user.id } });
            }
            break;
          }

          case 'transaction': {
            if (action === 'create' || action === 'upsert') {
              await Transaction.upsert({ ...data, collector_id: req.user.id });
            } else if (action === 'update') {
              await Transaction.update(data, { where: { id: data.id, collector_id: req.user.id } });
            }
            break;
          }

          case 'traceability': {
            if (action === 'create' || action === 'upsert') {
              await Traceability.upsert(data);
            }
            break;
          }

          default:
            logger.warn(`Unknown sync entity: ${entity}`);
        }
        results.applied++;
      } catch (changeErr) {
        results.failed++;
        results.errors.push({ entity: change.entity, id: change.data?.id, error: changeErr.message });
        logger.warn(`Sync change failed: ${changeErr.message}`);
      }
    }

    // Fetch server-side updates since last_sync_time
    const since = last_sync_time ? new Date(last_sync_time) : new Date(0);
    const now = new Date();

    const [prices, recyclers, transactions] = await Promise.all([
      // Updated prices (for price board cache refresh)
      Price.findAll({
        where: { updatedAt: { [Op.gte]: since } },
        order: [['updatedAt', 'DESC']],
        limit: 100,
      }),

      // Active recyclers (refresh cache)
      Recycler.findAll({
        where: { authorization_status: 'Active', updatedAt: { [Op.gte]: since } },
        attributes: ['id', 'name', 'lat', 'lng', 'materials_accepted', 'authorization_status', 'contact_phone', 'offered_rates', 'pickup_available', 'service_area_km'],
      }),

      // Collector's own transaction updates
      Transaction.findAll({
        where: { collector_id: req.user.id, updatedAt: { [Op.gte]: since } },
      }),
    ]);

    res.json({
      success: true,
      applied: results.applied,
      failed: results.failed,
      errors: results.errors,
      server_updates: { prices, recyclers, transactions },
      sync_time: now.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
