// src/routes/lots.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Material, Collector, Transaction, Traceability, Recycler } = require('../models');
const { authenticate } = require('../middleware/auth');
const { estimateValue } = require('../services/priceEstimate');
const { generateHandoverRef } = require('../utils/generateReference');
const { persistLotPhotos } = require('../services/curationPipeline');
const logger = require('../utils/logger');

const CPCB_CODE_MAP = {
  PCB: 'ITEW1',
  CRT: 'CEEW1',
  LCD: 'CEEW2',
  Cable: 'ITEW3',
  Battery: 'CEEW4',
  Motor: 'CEEW5',
  Plastic: 'ITEW10',
  Mixed: 'ITEW16',
  Other: 'ITEW16',
};

/**
 * POST /lots
 * Create a new material lot with AI-assisted value estimate
 */
router.post(
  '/',
  authenticate,
  [
    body('category').isIn(['CRT', 'LCD', 'PCB', 'Cable', 'Battery', 'Motor', 'Plastic', 'Mixed', 'Other']).withMessage('Invalid category'),
    body('approximate_weight_kg').isFloat({ min: 0.01 }).withMessage('Weight must be a positive number'),
    body('condition').optional().isIn(['Good', 'Damaged', 'Unknown']),
    body('source_type').optional().isIn(['Household', 'Commercial', 'Industrial']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const {
        category,
        sub_category,
        description,
        approximate_weight_kg,
        condition = 'Unknown',
        source_type = 'Household',
        image_refs = [],
        location_city = 'Mumbai',
      } = req.body;

      // Estimate value
      const estimate = await estimateValue(category, parseFloat(approximate_weight_kg), location_city);
      const cpcb_code = CPCB_CODE_MAP[category] || 'ITEW16';

      let assignedCollectorId = req.body.collector_id;
      if (!assignedCollectorId) {
        if (req.user?.role === 'collector') {
          assignedCollectorId = req.user.id;
        } else {
          const col = await Collector.findOne();
          assignedCollectorId = col ? col.id : req.user?.id;
        }
      }

      const lotId = uuidv4();
      const persistedImageRefs = persistLotPhotos(lotId, image_refs);

      const lot = await Material.create({
        id: lotId,
        lot_id: lotId,
        collector_id: assignedCollectorId,
        category,
        sub_category: sub_category || null,
        description: description || `${category} - ${approximate_weight_kg} kg`,
        image_refs: persistedImageRefs,
        approximate_weight_kg: parseFloat(approximate_weight_kg),
        condition,
        source_type,
        estimated_value_inr: estimate.estimated_value_inr,
        status: 'ESTIMATED',
        cpcb_code,
      });

      res.status(201).json({
        success: true,
        lot: {
          ...lot.toJSON(),
          price_per_kg: estimate.price_per_kg,
          price_range: estimate.range,
          confidence: estimate.confidence,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /lots/:id/generate-qr
 * Generates a cryptographic, time-expiring handover token for the lot
 */
router.post('/:id/generate-qr', authenticate, async (req, res, next) => {
  try {
    const lot = await Material.findOne({
      where: { id: req.params.id, collector_id: req.user.id },
    });
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found or unauthorized' });
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    const refCode = generateHandoverRef();
    const payload = {
      lot_id: lot.id,
      collector_id: req.user.id,
      category: lot.category,
      weight_kg: lot.approximate_weight_kg,
      reference: refCode,
      exp: expiresAt.getTime(),
    };

    const secret = process.env.JWT_SECRET || 'kabadconnect_qr_secret_key';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const qrToken = Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');

    await lot.update({
      qr_token: qrToken,
      qr_expires_at: expiresAt,
      status: 'HANDOVER_PENDING',
    });

    // Ensure Transaction and Traceability records exist for instant lookup
    let txnId = req.body.transaction_id;
    if (!txnId) {
      const existingTxn = await Transaction.findOne({
        where: { lot_id: lot.id },
        order: [['createdAt', 'DESC']],
      });
      txnId = existingTxn?.id;
    }
    if (!txnId) {
      let recId = req.body.recycler_id;
      if (!recId) {
        const activeRec = await Recycler.findOne({ where: { authorization_status: 'Active' } });
        recId = activeRec?.id;
      }

      const placeholderTxn = await Transaction.create({
        id: uuidv4(),
        lot_id: lot.id,
        collector_id: req.user.id,
        recycler_id: recId,
        material_category: lot.category,
        total_weight_kg: lot.approximate_weight_kg,
        quoted_price_inr: lot.estimated_value_inr || 100,
        collection_datetime: new Date(),
        collection_lat: parseFloat(req.body.lat) || 19.076,
        collection_lng: parseFloat(req.body.lng) || 72.8777,
        transaction_status: 'Matched',
      });
      txnId = placeholderTxn.id;
    }

    await Traceability.create({
      id: uuidv4(),
      lot_id: lot.id,
      transaction_id: txnId,
      weight_at_handover_kg: lot.approximate_weight_kg,
      gps_lat: parseFloat(req.body.lat) || 19.076,
      gps_lng: parseFloat(req.body.lng) || 72.8777,
      handover_reference: refCode,
      collector_signed: true,
      recycler_confirmed: false,
      subsequent_status: 'Pending',
    });

    res.json({
      success: true,
      qr_data: qrToken,
      reference: refCode,
      expires_at: expiresAt.toISOString(),
      expires_in_seconds: 900,
      lot: {
        id: lot.id,
        category: lot.category,
        approximate_weight_kg: lot.approximate_weight_kg,
        status: 'HANDOVER_PENDING',
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /lots
 * List all lots for the authenticated collector (supports status query)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    const where = { collector_id: req.user.id };
    if (status) where.status = status;

    const lots = await Material.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ success: true, total: lots.count, lots: lots.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /lots/:id
 * Get specific lot details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const lot = await Material.findOne({ where: { id: req.params.id, collector_id: req.user.id } });
    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found', code: 'NOT_FOUND' });
    res.json({ success: true, lot });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /lots/:id
 * Update lot fields
 */
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const lot = await Material.findOne({ where: { id: req.params.id, collector_id: req.user.id } });
    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

    const allowedFields = ['sub_category', 'description', 'approximate_weight_kg', 'condition', 'source_type', 'image_refs', 'status'];
    const updates = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    // Re-estimate if weight changed
    if (updates.approximate_weight_kg) {
      const estimate = await estimateValue(lot.category, parseFloat(updates.approximate_weight_kg), 'Mumbai');
      updates.estimated_value_inr = estimate.estimated_value_inr;
    }

    await lot.update(updates);
    res.json({ success: true, lot });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /lots/:id
 * Soft delete
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const lot = await Material.findOne({ where: { id: req.params.id, collector_id: req.user.id } });
    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });
    await lot.destroy();
    res.json({ success: true, message: 'Lot deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
