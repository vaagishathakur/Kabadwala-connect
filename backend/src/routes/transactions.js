// src/routes/transactions.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Transaction, Material, Recycler } = require('../models');
const { authenticate } = require('../middleware/auth');
const { checkAnomaly } = require('../services/anomalyCheck');
const { Op } = require('sequelize');

/**
 * POST /transactions
 * Create a new transaction when collector requests a recycler.
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { lot_id, recycler_id, quoted_price_inr, collection_lat, collection_lng, payment_mode = 'Cash' } = req.body;

    const lot = await Material.findOne({ where: { id: lot_id, collector_id: req.user.id } });
    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

    // Check for price anomaly
    const anomaly = await checkAnomaly(lot.category, 'Mumbai', parseFloat(quoted_price_inr));

    const transaction = await Transaction.create({
      id: uuidv4(),
      lot_id,
      collector_id: req.user.id,
      recycler_id: recycler_id || null,
      material_category: lot.category,
      total_weight_kg: lot.approximate_weight_kg,
      quoted_price_inr: parseFloat(quoted_price_inr),
      collection_lat: collection_lat ? parseFloat(collection_lat) : null,
      collection_lng: collection_lng ? parseFloat(collection_lng) : null,
      collection_datetime: new Date(),
      payment_mode,
      payment_status: 'Pending',
      transaction_status: recycler_id ? 'Matched' : 'Created',
      anomaly_flag: anomaly.is_anomaly,
      anomaly_score: anomaly.z_score,
    });

    res.status(201).json({
      success: true,
      transaction,
      anomaly_warning: anomaly.is_anomaly ? {
        message: 'Price is outside the normal market range',
        expected_range: anomaly.expected_range,
        z_score: anomaly.z_score,
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /transactions
 * List all transactions for the authenticated collector with earnings summary.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const where = { collector_id: req.user.id };
    if (status) where.transaction_status = status;

    const transactions = await Transaction.findAndCountAll({
      where,
      order: [['collection_datetime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{ model: Recycler, as: 'recycler', attributes: ['name', 'contact_phone'], required: false }],
    });

    // Earnings summary
    const allTx = await Transaction.findAll({
      where: { collector_id: req.user.id },
      attributes: ['final_price_inr', 'quoted_price_inr', 'payment_status', 'transaction_status'],
    });

    const totalEarned = allTx
      .filter((t) => t.payment_status === 'Paid')
      .reduce((s, t) => s + parseFloat(t.final_price_inr || t.quoted_price_inr || 0), 0);

    const totalPending = allTx
      .filter((t) => t.payment_status === 'Pending' && t.transaction_status !== 'Cancelled')
      .reduce((s, t) => s + parseFloat(t.quoted_price_inr || 0), 0);

    res.json({
      success: true,
      total: transactions.count,
      transactions: transactions.rows,
      summary: {
        total_earned_inr: +totalEarned.toFixed(2),
        pending_inr: +totalPending.toFixed(2),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /transactions/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({ where: { id: req.params.id, collector_id: req.user.id } });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /transactions/:id
 * Update transaction status (e.g., recycler accepts/declines).
 */
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const allowed = ['transaction_status', 'payment_status', 'payment_mode', 'recycler_id', 'final_price_inr'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await tx.update(updates);
    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
