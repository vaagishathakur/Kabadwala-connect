const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { handleInput, startCall, getDiagnostics } = require('../services/ivr/ivrEngine');
const { createTelephonyProvider, TwilioTelephonyProvider } = require('../telephony/provider');

const router = express.Router();

function baseUrl(req) {
  return process.env.IVR_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

router.get('/config', (req, res) => {
  res.json({
    success: true,
    feature: 'KabadConnect Saathi',
    provider: process.env.IVR_PROVIDER || 'mock',
    phone_number: process.env.IVR_PHONE_NUMBER || null,
    support_configured: Boolean(process.env.IVR_SUPPORT_NUMBER),
    recommended_provider: 'Twilio for quick webhook demos; Knowlarity or Exotel for India production telephony procurement.',
    simulator: `${baseUrl(req)}/api/ivr/simulator`,
  });
});

/**
 * POST /api/ivr/simulator
 * Unified JSON simulator endpoint for both call initiation and DTMF navigation
 */
router.post('/simulator', async (req, res, next) => {
  try {
    const { callId, digits, caller = 'simulator-user', language } = req.body;
    if (callId && digits !== undefined) {
      const response = await handleInput(callId, String(digits));
      return res.json({ success: true, response, callId, digits });
    }

    const sessionCallId = callId || `sim-${uuidv4()}`;
    const response = await startCall({
      providerCallId: sessionCallId,
      caller,
      language: language || null,
    });
    res.json({ success: true, response, callId: sessionCallId });
  } catch (err) {
    next(err);
  }
});

router.post('/simulator/start', async (req, res, next) => {
  try {
    const response = await startCall({
      providerCallId: req.body.callId || `sim-${uuidv4()}`,
      caller: req.body.caller || 'simulator',
      language: req.body.language || null,
    });
    res.json({ success: true, response, api_call: 'POST /api/ivr/simulator/start' });
  } catch (err) {
    next(err);
  }
});

router.post('/simulator/input', async (req, res, next) => {
  try {
    const response = await handleInput(req.body.callId, req.body.digits);
    res.json({ success: true, response, api_call: 'POST /api/ivr/simulator/input' });
  } catch (err) {
    next(err);
  }
});

router.get('/simulator/:callId', (req, res) => {
  const diagnostics = getDiagnostics(req.params.callId);
  if (!diagnostics) return res.status(404).json({ success: false, message: 'IVR session not found' });
  res.json({ success: true, session: diagnostics });
});

/**
 * POST /api/ivr/voice
 * Direct alias for standard telephony webhook greeting caller in Hindi/Marathi DTMF
 */
router.post('/voice', async (req, res, next) => {
  try {
    const provider = new TwilioTelephonyProvider(process.env);
    const callId = req.body.CallSid || `voice-${uuidv4()}`;
    const response = await startCall({ providerCallId: callId, caller: req.body.From || 'unknown' });
    const actionUrl = `${baseUrl(req)}/api/ivr/input?callId=${encodeURIComponent(callId)}`;
    res.type('text/xml').send(provider.format(response, actionUrl));
  } catch (err) {
    next(err);
  }
});

router.post('/input', async (req, res, next) => {
  try {
    const provider = new TwilioTelephonyProvider(process.env);
    const callId = req.query.callId || req.body.CallSid;
    const digits = req.query.empty ? '' : req.body.Digits;
    const response = await handleInput(callId, digits);
    const actionUrl = `${baseUrl(req)}/api/ivr/input?callId=${encodeURIComponent(response.callId)}`;
    res.type('text/xml').send(provider.format(response, actionUrl));
  } catch (err) {
    next(err);
  }
});

router.post('/twilio/voice', async (req, res, next) => {
  try {
    const provider = new TwilioTelephonyProvider(process.env);
    const callId = req.body.CallSid || `twilio-${uuidv4()}`;
    const response = await startCall({ providerCallId: callId, caller: req.body.From || 'unknown' });
    const actionUrl = `${baseUrl(req)}/api/ivr/twilio/input?callId=${encodeURIComponent(callId)}`;
    res.type('text/xml').send(provider.format(response, actionUrl));
  } catch (err) {
    next(err);
  }
});

router.post('/twilio/input', async (req, res, next) => {
  try {
    const provider = new TwilioTelephonyProvider(process.env);
    const callId = req.query.callId || req.body.CallSid;
    const digits = req.query.empty ? '' : req.body.Digits;
    const response = await handleInput(callId, digits);
    const actionUrl = `${baseUrl(req)}/api/ivr/twilio/input?callId=${encodeURIComponent(response.callId)}`;
    res.type('text/xml').send(provider.format(response, actionUrl));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
