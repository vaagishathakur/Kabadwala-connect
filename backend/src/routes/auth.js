// src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Collector, Recycler } = require('../models');
const logger = require('../utils/logger');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

// Demo OTP for development
const DEMO_OTP = '123456';

/**
 * POST /auth/send-otp
 * Send OTP to phone number (mock for demo)
 */
router.post(
  '/send-otp',
  [body('phone').isMobilePhone('any').withMessage('Valid phone number required')],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;
    // Store OTP hash (in production: send via SMS gateway like MSG91/Exotel)
    const otp = DEMO_OTP;
    otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    logger.info(`OTP generated for ${phone.slice(-4).padStart(phone.length, '*')}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      demo_otp: otp, // Remove in production!
      expires_in: 300,
    });
  }
);

/**
 * POST /auth/verify-otp
 * Verify OTP and return JWT + collector profile
 */
router.post(
  '/verify-otp',
  [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('role').optional().isIn(['collector', 'recycler']).withMessage('Invalid role'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, otp, role = 'collector', display_name, preferred_language = 'hi', operating_city } = req.body;

      // Verify OTP
      const stored = otpStore.get(phone);
      if (!stored) {
        return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.', code: 'OTP_NOT_FOUND' });
      }
      if (Date.now() > stored.expires) {
        otpStore.delete(phone);
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.', code: 'OTP_EXPIRED' });
      }
      if (stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP.', code: 'OTP_INVALID' });
      }
      otpStore.delete(phone);

      // Hash phone for storage
      const phone_hash = require('crypto').createHash('sha256').update(phone).digest('hex');

      let user;
      if (role === 'recycler') {
        user = await Recycler.findOne({ where: { contact_phone: phone } });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Recycler not found. Contact admin to register.', code: 'RECYCLER_NOT_FOUND' });
        }
      } else {
        // Create or find collector
        [user] = await Collector.findOrCreate({
          where: { phone_hash },
          defaults: {
            id: uuidv4(),
            phone_hash,
            display_name: display_name || null,
            preferred_language,
            operating_city: operating_city || null,
            registration_date: new Date(),
          },
        });
      }

      // Issue JWT
      const token = jwt.sign(
        { id: user.id, role, phone, phone_hash },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          display_name: user.display_name || user.name,
          role,
          preferred_language: user.preferred_language || 'hi',
          operating_city: user.operating_city || user.facility_address,
          total_earnings_inr: user.total_earnings_inr || 0,
          total_transactions: user.total_transactions || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /auth/profile
 * Update collector profile (language, city, name)
 */
router.patch('/profile', require('../middleware/auth').authenticate, async (req, res, next) => {
  try {
    const { display_name, preferred_language, operating_city } = req.body;
    const collector = await Collector.findByPk(req.user.id);
    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found' });

    await collector.update({ display_name, preferred_language, operating_city });
    res.json({ success: true, user: collector });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
