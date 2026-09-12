// src/routes/handover.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Traceability, Transaction, Material, Recycler, Collector, EPRLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { generateHandoverRef } = require('../utils/generateReference');
const logger = require('../utils/logger');

function verifyQrToken(token) {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const { payload, signature } = JSON.parse(raw);
    const secret = process.env.JWT_SECRET || 'kabadconnect_qr_secret_key';
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSig) return { valid: false, error: 'Invalid QR signature' };
    if (Date.now() > payload.exp) return { valid: false, error: 'QR token expired' };
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: 'Malformed QR token' };
  }
}

/**
 * POST /handover/verify
 * Recycler scans QR, inputs actual weighed scale measurement and verified purity grade,
 * updates lot state to VERIFIED, creates immutable Transaction & EPRLog records.
 */
router.post(
  '/verify',
  [
    body('recycler_id').isUUID().withMessage('Valid recycler_id required'),
    body('confirmed_weight_kg').isFloat({ min: 0.01 }).withMessage('Confirmed scale weight must be positive'),
    body('purity_percentage').optional().isFloat({ min: 1, max: 100 }).withMessage('Purity must be between 1 and 100'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const {
        qr_token,
        handover_reference,
        lot_id: requested_lot_id,
        recycler_id,
        confirmed_weight_kg,
        purity_percentage = 100.0,
        final_price_inr,
        payment_mode = 'Cash',
        gps_lat,
        gps_lng,
      } = req.body;

      let targetLotId = requested_lot_id;
      let targetRef = handover_reference;

      // If QR token supplied, verify signature
      if (qr_token) {
        const tokenCheck = verifyQrToken(qr_token);
        if (!tokenCheck.valid) {
          return res.status(400).json({ success: false, message: tokenCheck.error });
        }
        targetLotId = tokenCheck.payload.lot_id;
        targetRef = tokenCheck.payload.reference || targetRef;
      }

      // If reference supplied without lot_id
      if (!targetLotId && targetRef) {
        const trace = await Traceability.findOne({ where: { handover_reference: targetRef.toUpperCase() } });
        if (trace) targetLotId = trace.lot_id;
      }

      if (!targetLotId) {
        return res.status(400).json({ success: false, message: 'Valid qr_token, lot_id, or handover_reference is required' });
      }

      const lot = await Material.findByPk(targetLotId);
      if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

      const recycler = await Recycler.findByPk(recycler_id);
      if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });

      const collector = await Collector.findByPk(lot.collector_id);

      const netWeight = +(parseFloat(confirmed_weight_kg) * (parseFloat(purity_percentage) / 100)).toFixed(2);
      
      // Calculate final price: explicit final_price_inr, or rate * net weight
      const unitRate = lot.approximate_weight_kg > 0 ? (parseFloat(lot.estimated_value_inr) / parseFloat(lot.approximate_weight_kg)) : 50;
      const calculatedPrice = final_price_inr ? parseFloat(final_price_inr) : +(unitRate * netWeight).toFixed(2);

      const transferLat = parseFloat(gps_lat) || parseFloat(recycler.lat) || 19.076;
      const transferLng = parseFloat(gps_lng) || parseFloat(recycler.lng) || 72.8777;
      const timestamp = new Date();
      const ref = targetRef || generateHandoverRef();

      // 1. Create Immutable Transaction Record
      const transaction = await Transaction.create({
        id: uuidv4(),
        lot_id: lot.id,
        collector_id: lot.collector_id,
        recycler_id: recycler.id,
        material_category: lot.category,
        total_weight_kg: netWeight,
        quoted_price_inr: lot.estimated_value_inr || calculatedPrice,
        final_price_inr: calculatedPrice,
        collection_lat: transferLat,
        collection_lng: transferLng,
        handover_lat: transferLat,
        handover_lng: transferLng,
        collection_datetime: lot.created_at || timestamp,
        handover_datetime: timestamp,
        payment_mode,
        payment_status: payment_mode === 'Cash' ? 'Paid' : 'Pending',
        transaction_status: 'Completed',
        anomaly_flag: false,
      });

      // 2. Create CPCB-Compliant Tamper-Evident EPRLog
      const anonCollectorId = crypto
        .createHash('sha256')
        .update(collector ? collector.id : lot.collector_id)
        .digest('hex');

      const auditPayload = `${lot.id}|${transaction.id}|${recycler.authorization_number}|${netWeight}|${calculatedPrice}|${timestamp.toISOString()}`;
      const auditHash = crypto.createHash('sha256').update(auditPayload).digest('hex');

      const eprLog = await EPRLog.create({
        id: uuidv4(),
        transaction_id: transaction.id,
        lot_id: lot.id,
        collector_anonymized_id: anonCollectorId,
        recycler_id: recycler.id,
        recycler_cpcb_reg_no: recycler.authorization_number || 'CPCB-REG-2024-MH-0042',
        material_cpcb_code: lot.cpcb_code || 'ITEW1',
        material_category: lot.category,
        claimed_weight_kg: lot.approximate_weight_kg,
        confirmed_net_weight_kg: netWeight,
        purity_percentage: parseFloat(purity_percentage),
        payout_amount_inr: calculatedPrice,
        gps_lat: transferLat,
        gps_lng: transferLng,
        handover_timestamp: timestamp,
        audit_hash: auditHash,
      });

      // 3. Update Traceability Record for backward compatibility
      await Traceability.findOrCreate({
        where: { transaction_id: transaction.id },
        defaults: {
          id: uuidv4(),
          lot_id: lot.id,
          transaction_id: transaction.id,
          handover_reference: ref,
          weight_at_handover_kg: netWeight,
          gps_lat: transferLat,
          gps_lng: transferLng,
          collector_signed: true,
          recycler_confirmed: true,
          recycler_confirm_time: timestamp,
          subsequent_status: 'ReceivedAtFacility',
        },
      });

      // 4. Update Lot Status to VERIFIED
      await lot.update({
        status: 'VERIFIED',
      });

      // 5. Update Collector earnings
      if (collector) {
        await collector.increment({
          total_earnings_inr: calculatedPrice,
          total_transactions: 1,
        });
      }

      logger.info(`Handover verified for lot ${lot.id}. EPR record created: ${eprLog.id}`);

      res.status(200).json({
        success: true,
        message: 'Handover verified and CPCB EPR record generated successfully',
        lot_status: 'VERIFIED',
        handover_reference: ref,
        transaction: {
          id: transaction.id,
          final_price_inr: calculatedPrice,
          total_weight_kg: netWeight,
          payment_status: transaction.payment_status,
        },
        epr_log: {
          id: eprLog.id,
          cpcb_reg_no: eprLog.recycler_cpcb_reg_no,
          material_cpcb_code: eprLog.material_cpcb_code,
          audit_hash: eprLog.audit_hash,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /handover/initiate (Legacy compatibility)
 */
router.post(
  '/initiate',
  authenticate,
  [
    body('lot_id').isUUID().withMessage('Valid lot_id required'),
    body('weight_at_handover_kg').isFloat({ min: 0.01 }).withMessage('Weight must be positive'),
    body('gps_lat').isFloat({ min: 6, max: 37 }).withMessage('Invalid GPS latitude for India'),
    body('gps_lng').isFloat({ min: 68, max: 97 }).withMessage('Invalid GPS longitude for India'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { lot_id, transaction_id, weight_at_handover_kg, gps_lat, gps_lng, photograph_refs = [] } = req.body;

      const lot = await Material.findOne({ where: { id: lot_id, collector_id: req.user.id } });
      if (!lot) return res.status(404).json({ success: false, message: 'Lot not found or access denied' });

      let txnId = transaction_id;
      if (!txnId) {
        // Create initial placeholder transaction
        const txn = await Transaction.create({
          id: uuidv4(),
          lot_id,
          collector_id: req.user.id,
          recycler_id: req.body.recycler_id || uuidv4(),
          material_category: lot.category,
          total_weight_kg: parseFloat(weight_at_handover_kg),
          quoted_price_inr: lot.estimated_value_inr || 100,
          collection_datetime: new Date(),
          collection_lat: parseFloat(gps_lat),
          collection_lng: parseFloat(gps_lng),
          transaction_status: 'Matched',
        });
        txnId = txn.id;
      }

      let handover_reference;
      for (let i = 0; i < 5; i++) {
        const ref = generateHandoverRef();
        const existing = await Traceability.findOne({ where: { handover_reference: ref } });
        if (!existing) { handover_reference = ref; break; }
      }

      const traceability = await Traceability.create({
        id: uuidv4(),
        lot_id,
        transaction_id: txnId,
        photograph_refs,
        weight_at_handover_kg: parseFloat(weight_at_handover_kg),
        timestamp: new Date(),
        gps_lat: parseFloat(gps_lat),
        gps_lng: parseFloat(gps_lng),
        handover_reference,
        collector_signed: true,
        recycler_confirmed: false,
        subsequent_status: 'Pending',
      });

      await lot.update({ status: 'HANDOVER_PENDING' });

      res.status(201).json({
        success: true,
        handover_reference,
        trace_id: traceability.id,
        transaction_id: txnId,
        qr_data: `${handover_reference}|${lot_id}|${new Date().toISOString()}`,
        message: 'Show QR code to recycler for confirmation',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /handover/confirm (Legacy compatibility)
 */
router.post(
  '/confirm',
  [
    body('handover_reference').isLength({ min: 8, max: 8 }).withMessage('Invalid reference code'),
    body('recycler_id').isUUID().withMessage('Valid recycler_id required'),
    body('final_weight_kg').isFloat({ min: 0.01 }).withMessage('Final weight required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { handover_reference, recycler_id, final_weight_kg, final_price_inr, payment_mode = 'Cash' } = req.body;

      const trace = await Traceability.findOne({ where: { handover_reference: handover_reference.toUpperCase() } });
      if (!trace) return res.status(404).json({ success: false, message: 'Handover reference not found' });
      if (trace.recycler_confirmed) {
        return res.status(409).json({ success: false, message: 'Handover already confirmed' });
      }

      const recycler = await Recycler.findByPk(recycler_id);
      if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });

      await trace.update({
        recycler_confirmed: true,
        recycler_confirm_time: new Date(),
        weight_at_handover_kg: parseFloat(final_weight_kg),
        subsequent_status: 'ReceivedAtFacility',
      });

      const lot = await Material.findByPk(trace.lot_id);
      if (lot) await lot.update({ status: 'VERIFIED' });

      const transaction = await Transaction.findByPk(trace.transaction_id);
      if (transaction) {
        await transaction.update({
          transaction_status: 'Completed',
          recycler_id,
          final_price_inr: final_price_inr ? parseFloat(final_price_inr) : transaction.quoted_price_inr,
          payment_mode,
          payment_status: payment_mode === 'Cash' ? 'Paid' : 'Pending',
          total_weight_kg: parseFloat(final_weight_kg),
        });

        const collector = await Collector.findByPk(transaction.collector_id);
        if (collector && final_price_inr) {
          await collector.increment({
            total_earnings_inr: parseFloat(final_price_inr),
            total_transactions: 1,
          });
        }
      }

      res.json({
        success: true,
        message: 'Handover confirmed successfully',
        handover_reference,
        transaction_status: 'Completed',
        final_weight_kg: parseFloat(final_weight_kg),
        final_price_inr: final_price_inr || transaction?.quoted_price_inr,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /handover/:reference
 * Lookup handover details by reference code (for QR scan verification)
 */
router.get('/:reference', async (req, res, next) => {
  try {
    const trace = await Traceability.findOne({
      where: { handover_reference: req.params.reference.toUpperCase() },
    });
    if (!trace) return res.status(404).json({ success: false, message: 'Handover not found' });

    const transaction = await Transaction.findByPk(trace.transaction_id);
    const lot = await Material.findByPk(trace.lot_id);

    res.json({
      success: true,
      handover: {
        ...trace.toJSON(),
        transaction: transaction ? { id: transaction.id, status: transaction.transaction_status, quoted_price_inr: transaction.quoted_price_inr } : null,
        lot: lot ? { id: lot.id, category: lot.category, approximate_weight_kg: lot.approximate_weight_kg, description: lot.description, cpcb_code: lot.cpcb_code, status: lot.status } : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
