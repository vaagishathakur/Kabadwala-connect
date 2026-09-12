// src/routes/epr.js
const express = require('express');
const router = express.Router();
const { EPRLog, Recycler } = require('../models');

/**
 * GET /epr/logs
 * List EPR compliance log entries with optional filters
 */
router.get('/logs', async (req, res, next) => {
  try {
    const { recycler_id, cpcb_code, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (recycler_id) where.recycler_id = recycler_id;
    if (cpcb_code) where.material_cpcb_code = cpcb_code;

    const logs = await EPRLog.findAndCountAll({
      where,
      order: [['handover_timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      total: logs.count,
      logs: logs.rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /epr/summary
 * Aggregate EPR metrics by CPCB category code
 */
router.get('/summary', async (req, res, next) => {
  try {
    const { recycler_id } = req.query;
    const where = recycler_id ? { recycler_id } : {};

    const logs = await EPRLog.findAll({ where });

    const summary = {};
    let totalWeight = 0;
    let totalPayout = 0;

    logs.forEach((log) => {
      const code = log.material_cpcb_code || 'ITEW16';
      if (!summary[code]) {
        summary[code] = {
          code,
          category: log.material_category,
          total_weight_kg: 0,
          total_payout_inr: 0,
          record_count: 0,
        };
      }
      const weight = parseFloat(log.confirmed_net_weight_kg) || 0;
      const payout = parseFloat(log.payout_amount_inr) || 0;
      summary[code].total_weight_kg = +(summary[code].total_weight_kg + weight).toFixed(2);
      summary[code].total_payout_inr = +(summary[code].total_payout_inr + payout).toFixed(2);
      summary[code].record_count += 1;
      totalWeight += weight;
      totalPayout += payout;
    });

    res.json({
      success: true,
      total_records: logs.length,
      total_weight_kg: +totalWeight.toFixed(2),
      total_payout_inr: +totalPayout.toFixed(2),
      by_cpcb_code: Object.values(summary),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /epr/export
 * Download CSV manifest formatted for CPCB E-Waste (Management) Rules, 2022
 */
router.get('/export', async (req, res, next) => {
  try {
    const { recycler_id } = req.query;
    const where = recycler_id ? { recycler_id } : {};

    const logs = await EPRLog.findAll({
      where,
      order: [['handover_timestamp', 'ASC']],
    });

    const headers = [
      'Transaction_UUID',
      'CPCB_Registration_No',
      'Material_CPCB_Code',
      'Category',
      'Collector_Anonymized_Hash',
      'Claimed_Weight_KG',
      'Confirmed_Net_Weight_KG',
      'Purity_Percentage',
      'Payout_Amount_INR',
      'GPS_Latitude',
      'GPS_Longitude',
      'Handover_Timestamp',
      'Tamper_Audit_Hash',
    ];

    const rows = logs.map((l) => [
      l.transaction_id,
      `"${l.recycler_cpcb_reg_no}"`,
      l.material_cpcb_code,
      l.material_category,
      l.collector_anonymized_id,
      l.claimed_weight_kg,
      l.confirmed_net_weight_kg,
      l.purity_percentage,
      l.payout_amount_inr,
      l.gps_lat,
      l.gps_lng,
      new Date(l.handover_timestamp).toISOString(),
      l.audit_hash,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="CPCB_EPR_Manifest_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
