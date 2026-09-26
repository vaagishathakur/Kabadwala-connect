// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { Transaction, EPRLog, Lot, Collector, Recycler } = require('../models');
const { formatReceipt, generateWhatsAppUrl, dispatchSmsNotification } = require('../services/notifications/receiptSender');
const logger = require('../utils/logger');

/**
 * POST /api/notifications/receipt/dispatch
 * Generates bilingual receipt, WhatsApp direct link, and dispatches simulated DLT carrier SMS.
 */
router.post('/receipt/dispatch', async (req, res, next) => {
  try {
    const {
      transaction_id,
      collector_phone,
      collector_name,
      reference,
      cpcb_code,
      material_name,
      net_weight_kg,
      purity,
      amount,
      payment_mode,
      utr,
      recycler_name,
      cpcb_reg_no,
      audit_hash_short,
      lang = 'hi',
    } = req.body;

    let receiptData = {
      collector_name: collector_name || 'कबाड़ीवाला (Collector)',
      collector_phone: collector_phone || '9876543210',
      reference: reference || 'KC-REF',
      cpcb_code: cpcb_code || 'ITEW1',
      material_name: material_name || 'ई-कचरा / Printed Circuit Boards',
      net_weight_kg: net_weight_kg || '0.00',
      purity: purity || '100',
      amount: amount || '0',
      payment_mode: payment_mode || 'UPI',
      utr: utr || 'NA',
      recycler_name: recycler_name || 'KabadConnect Central Recyclers Pvt Ltd',
      cpcb_reg_no: cpcb_reg_no || 'CPCB-REG-2024-MH-0042',
      audit_hash_short: audit_hash_short || 'N/A',
    };

    // If transaction_id provided, look up db record to enrich receipt data
    if (transaction_id) {
      try {
        const tx = await Transaction.findByPk(transaction_id, {
          include: [
            { model: Recycler, as: 'recycler' },
          ],
        });

        if (tx) {
          receiptData.amount = tx.final_price_inr || receiptData.amount;
          receiptData.payment_mode = tx.payment_mode || receiptData.payment_mode;
          receiptData.utr = tx.upi_utr || receiptData.utr;
          receiptData.net_weight_kg = tx.total_weight_kg || receiptData.net_weight_kg;

          if (tx.recycler) {
            receiptData.recycler_name = tx.recycler.company_name || receiptData.recycler_name;
            receiptData.cpcb_reg_no = tx.recycler.authorization_number || receiptData.cpcb_reg_no;
          }

          const epr = await EPRLog.findOne({ where: { transaction_id } });
          if (epr) {
            receiptData.cpcb_code = epr.material_cpcb_code || receiptData.cpcb_code;
            receiptData.material_name = epr.material_category || receiptData.material_name;
            receiptData.purity = epr.purity_percentage || receiptData.purity;
            receiptData.audit_hash_short = epr.audit_hash ? epr.audit_hash.slice(0, 16) + '...' : receiptData.audit_hash_short;
          }

          if (tx.collector_id) {
            const collector = await Collector.findByPk(tx.collector_id);
            if (collector) {
              receiptData.collector_name = collector.name || receiptData.collector_name;
              receiptData.collector_phone = collector.phone || receiptData.collector_phone;
            }
          }
        }
      } catch (dbErr) {
        logger.warn(`Could not fetch db transaction ${transaction_id} for receipt: ${dbErr.message}`);
      }
    }

    const formattedMessage = formatReceipt(receiptData, lang);
    const whatsappUrl = generateWhatsAppUrl(receiptData.collector_phone, formattedMessage);
    const smsResult = await dispatchSmsNotification(receiptData.collector_phone, formattedMessage);

    return res.status(200).json({
      success: true,
      message: 'Receipt generated and dispatched successfully',
      receipt_data: receiptData,
      formatted_receipt: formattedMessage,
      whatsapp_url: whatsappUrl,
      sms: smsResult,
      language: lang,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/receipt/:transaction_id
 * Preview receipt in desired language
 */
router.get('/receipt/:transaction_id', async (req, res, next) => {
  try {
    const { transaction_id } = req.params;
    const lang = req.query.lang || 'hi';

    const tx = await Transaction.findByPk(transaction_id, {
      include: [{ model: Recycler, as: 'recycler' }],
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const epr = await EPRLog.findOne({ where: { transaction_id } });
    const collector = tx.collector_id ? await Collector.findByPk(tx.collector_id) : null;

    const receiptData = {
      collector_name: collector ? collector.name : 'Kabadiwala Partner',
      collector_phone: collector ? collector.phone : '9876543210',
      reference: tx.id.slice(0, 8).toUpperCase(),
      cpcb_code: epr ? epr.material_cpcb_code : 'ITEW1',
      material_name: epr ? epr.material_category : 'Printed Circuit Boards',
      net_weight_kg: tx.total_weight_kg,
      purity: epr ? epr.purity_percentage : 100,
      amount: tx.final_price_inr,
      payment_mode: tx.payment_mode || 'UPI',
      utr: tx.upi_utr || 'NA',
      recycler_name: tx.recycler ? tx.recycler.company_name : 'KabadConnect Recycler',
      cpcb_reg_no: tx.recycler ? tx.recycler.authorization_number : 'CPCB-REG-2024-MH-0042',
      audit_hash_short: epr && epr.audit_hash ? epr.audit_hash.slice(0, 16) + '...' : 'N/A',
    };

    const formattedMessage = formatReceipt(receiptData, lang);
    const whatsappUrl = generateWhatsAppUrl(receiptData.collector_phone, formattedMessage);

    return res.status(200).json({
      success: true,
      receipt_data: receiptData,
      formatted_receipt: formattedMessage,
      whatsapp_url: whatsappUrl,
      language: lang,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
