// src/pages/HandoverConfirm.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Alert,
  Grid, CircularProgress, Card, CardContent, Divider, Slider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ScaleIcon from '@mui/icons-material/Scale';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../api/client';

export default function HandoverConfirm() {
  const [reference, setReference] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [handoverData, setHandoverData] = useState(null);
  const [finalWeight, setFinalWeight] = useState('');
  const [purity, setPurity] = useState(98);
  const [finalPrice, setFinalPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      }, false);

      scanner.render(
        (decodedText) => {
          handleScannedData(decodedText);
          scanner.clear();
          setShowScanner(false);
        },
        (err) => {
          // scanning frame errors can be ignored
        }
      );
      scannerRef.current = scanner;

      return () => {
        try {
          scanner.clear();
        } catch (e) {}
      };
    }
  }, [showScanner]);

  const handleScannedData = (text) => {
    // Check if token is Base64URL JWT / HMAC token
    if (text.length > 50 && !text.includes('|')) {
      setQrToken(text);
      // Try to decode basic payload from base64
      try {
        const raw = atob(text);
        const parsed = JSON.parse(raw);
        if (parsed?.payload?.reference) {
          setReference(parsed.payload.reference);
        }
      } catch (e) {}
    } else if (text.includes('|')) {
      const parts = text.split('|');
      setReference(parts[0]);
    } else {
      setReference(text.trim().toUpperCase());
    }
    // Auto lookup
    lookupReference(text);
  };

  const lookupReference = async (codeToLookup) => {
    const code = codeToLookup || reference;
    if (!code || code.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      let refToUse = code;
      if (code.includes('|')) refToUse = code.split('|')[0];
      const res = await api.get(`/handover/${refToUse.toUpperCase()}`);
      setHandoverData(res.data.handover);
      setFinalWeight(res.data.handover.weight_at_handover_kg?.toString() || '');
      const claimedVal = res.data.handover.lot?.estimated_value_inr || res.data.handover.transaction?.quoted_price_inr;
      if (claimedVal) setFinalPrice(claimedVal.toString());
    } catch (e) {
      setError(e.response?.data?.message || 'Handover reference not found in database');
    }
    setLoading(false);
  };

  const verifyAndConfirm = async () => {
    if (!finalWeight || parseFloat(finalWeight) <= 0) {
      setError('Please enter a valid scale measured weight (kg)');
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const storedRecycler = JSON.parse(localStorage.getItem('kc_recycler') || '{}');
      const recyclerId = storedRecycler.id || 'b0000000-0000-0000-0000-000000000001';

      const res = await api.post('/handover/verify', {
        qr_token: qrToken || undefined,
        handover_reference: reference.toUpperCase(),
        lot_id: handoverData?.lot_id || undefined,
        recycler_id: recyclerId,
        confirmed_weight_kg: parseFloat(finalWeight),
        purity_percentage: parseFloat(purity),
        final_price_inr: finalPrice ? parseFloat(finalPrice) : undefined,
        payment_mode: 'Cash',
      });

      setSuccessData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Verification failed. Please check inputs.');
    }
    setConfirming(false);
  };

  if (successData) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, maxWidth: 650, mx: 'auto' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: '#2E7D32', mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" color="success.main">Handover Verified! ✅</Typography>
        <Typography variant="subtitle1" color="text.secondary" mt={1}>
          E-Waste lot successfully logged into CPCB Extended Producer Responsibility (EPR) registry.
        </Typography>

        <Paper elevation={3} sx={{ p: 3, my: 4, textAlign: 'left', bgcolor: '#F1F8E9' }}>
          <Typography variant="subtitle2" fontWeight="bold" color="#1B5E20" gutterBottom>
            CPCB EPR TRANSACTION MANIFEST
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">CPCB Material Code</Typography>
              <Typography variant="body1" fontWeight="bold">{successData.epr_log?.material_cpcb_code || 'ITEW1'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Confirmed Net Weight</Typography>
              <Typography variant="body1" fontWeight="bold">{successData.transaction?.total_weight_kg} kg</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Final Payout Amount</Typography>
              <Typography variant="body1" fontWeight="bold">₹{successData.transaction?.final_price_inr}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">CPCB Auth Reg No.</Typography>
              <Typography variant="body2">{successData.epr_log?.cpcb_reg_no || 'CPCB-REG-2024-MH-0042'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Tamper-Evident SHA-256 Audit Signature</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: '#fff', p: 1, borderRadius: 1 }}>
                {successData.epr_log?.audit_hash || '7d4a5b9c...f4a1'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Button
          variant="contained"
          sx={{ py: 1.5, px: 4, bgcolor: '#1B5E20', '&:hover': { bgcolor: '#2E7D32' } }}
          onClick={() => {
            setSuccessData(null);
            setHandoverData(null);
            setReference('');
            setQrToken('');
          }}
        >
          Verify Another Lot
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={720}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        <ScaleIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#1B5E20' }} />
        CPCB E-Waste Intake & Handover Verification
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Verify informal collector lot via Web Camera QR scanner or 8-character reference code to certify net weight and log EPR compliance.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Step 1: Scanner or Code */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          Step 1: Scan Collector QR Code or Enter Reference
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant={showScanner ? "outlined" : "contained"}
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setShowScanner(!showScanner)}
            sx={{ bgcolor: showScanner ? 'transparent' : '#1B5E20', '&:hover': { bgcolor: '#2E7D32' } }}
          >
            {showScanner ? "Close Camera" : "Open Camera Scanner"}
          </Button>
        </Box>

        {showScanner && (
          <Box sx={{ mb: 3, border: '2px dashed #4CAF50', p: 2, borderRadius: 2 }}>
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Handover Reference Code"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            inputProps={{ maxLength: 16, style: { fontFamily: 'monospace', fontSize: 22, letterSpacing: 4 } }}
            placeholder="KC3F8A2B"
            helperText="8-character code shown on collector's mobile app"
            fullWidth
          />
          <Button
            variant="contained"
            onClick={() => lookupReference()}
            disabled={loading || reference.length < 6}
            sx={{ height: 56, minWidth: 110, bgcolor: '#1B5E20', '&:hover': { bgcolor: '#2E7D32' } }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Lookup'}
          </Button>
        </Box>
      </Paper>

      {/* Step 2 & 3: Comparison & Purity Inputs */}
      {handoverData && (
        <>
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Step 2: Compare Collector Claims vs Verified Specifications
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Material Category</Typography>
                <Typography variant="body1" fontWeight="600">{handoverData.lot?.category || 'Electronic Waste'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">CPCB Classification Code</Typography>
                <Typography variant="body1" fontWeight="600" color="#1B5E20">{handoverData.lot?.cpcb_code || 'ITEW1'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Collector Claimed Weight</Typography>
                <Typography variant="body1">{handoverData.weight_at_handover_kg || handoverData.lot?.approximate_weight_kg || '—'} kg</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Original Quoted Rate</Typography>
                <Typography variant="body1">₹{handoverData.transaction?.quoted_price_inr || handoverData.lot?.estimated_value_inr || '—'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Step 3: Actual Scale Measurement & Purity Deduction
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirmed Scale Weight (kg)"
                  type="number"
                  value={finalWeight}
                  onChange={(e) => setFinalWeight(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0.01, step: 0.1 }}
                  helperText="Actual calibrated net weight measured on facility scale"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Total Final Payout (₹)"
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Calculated or adjusted total compensation"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Material Purity Grade / Moisture Deduction: <strong>{purity}% Net Pure Yield</strong>
                </Typography>
                <Slider
                  value={purity}
                  onChange={(e, val) => setPurity(val)}
                  valueLabelDisplay="auto"
                  min={50}
                  max={100}
                  marks={[
                    { value: 60, label: '60% (Mixed/Dross)' },
                    { value: 80, label: '80% (Grade B)' },
                    { value: 95, label: '95% (Standard)' },
                    { value: 100, label: '100% (Clean)' },
                  ]}
                  sx={{ color: '#1B5E20' }}
                />
              </Grid>
            </Grid>

            {finalWeight && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#E8F5E9', borderRadius: 1.5 }}>
                <Typography variant="body2" color="#1B5E20">
                  <strong>Effective EPR Certified Net Weight:</strong> {(parseFloat(finalWeight) * (purity / 100)).toFixed(2)} kg
                </Typography>
              </Box>
            )}
          </Paper>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={verifyAndConfirm}
            disabled={confirming || !finalWeight}
            startIcon={<VerifiedUserIcon />}
            sx={{ py: 1.8, bgcolor: '#1B5E20', '&:hover': { bgcolor: '#2E7D32' }, fontSize: 16, fontWeight: 'bold' }}
          >
            {confirming ? <CircularProgress size={24} color="inherit" /> : 'Certify & Complete EPR Handover'}
          </Button>
        </>
      )}
    </Box>
  );
}
