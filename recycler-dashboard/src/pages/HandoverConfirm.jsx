// src/pages/HandoverConfirm.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Alert,
  Grid, CircularProgress, Divider, Slider,
  Radio, RadioGroup, FormControlLabel, Chip, Stack, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ScaleIcon from '@mui/icons-material/Scale';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useLocation } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import CPCBForm6CertificateModal from '../components/CPCBForm6CertificateModal';
import CategoryVisualBadge from '../components/CategoryVisualBadge';
import AudioReadoutButton from '../components/AudioReadoutButton';

export default function HandoverConfirm() {
  const location = useLocation();
  const { lang, t, CATEGORY_DATA } = useLanguage();

  const [reference, setReference] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [handoverData, setHandoverData] = useState(null);
  const [finalWeight, setFinalWeight] = useState('');
  const [purity, setPurity] = useState(98);
  const [finalPrice, setFinalPrice] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [collectorVpa, setCollectorVpa] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutResult, setPayoutResult] = useState(null);
  const [receiptLang, setReceiptLang] = useState(lang);
  const [receiptSending, setReceiptSending] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    setReceiptLang(lang);
  }, [lang]);

  useEffect(() => {
    if (location.state?.reference) {
      setReference(location.state.reference);
      lookupReference(location.state.reference);
    } else if (location.state?.lot) {
      const lot = location.state.lot;
      setHandoverData({
        lot,
        weight_at_handover_kg: lot.approximate_weight_kg,
        quoted_price_inr: lot.estimated_value_inr,
      });
      setFinalWeight(String(lot.approximate_weight_kg || ''));
      setFinalPrice(String(lot.estimated_value_inr || ''));
    }
  }, [location.state]);

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
          // scanner frame error can be ignored
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
    if (text.length > 50 && !text.includes('|')) {
      setQrToken(text);
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
      setError(e.response?.data?.message || t('common.error', 'Handover reference not found in database'));
    }
    setLoading(false);
  };

  const verifyAndConfirm = async () => {
    if (!finalWeight || parseFloat(finalWeight) <= 0) {
      setError(t('weighbridge.scaleWeightHelper', 'Please enter a valid scale measured weight (kg)'));
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
        payment_mode: paymentMode,
        collector_vpa: collectorVpa || undefined,
      });

      setSuccessData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || t('common.error', 'Verification failed. Please check inputs.'));
    }
    setConfirming(false);
  };

  const handleInstantUpiPayout = async () => {
    if (!successData?.transaction?.id) return;
    setPayoutLoading(true);
    try {
      const vpaToUse = collectorVpa || `${handoverData?.lot?.collector_id?.slice(0, 8) || 'collector'}@upi`;
      const res = await api.post('/handover/upi-payout', {
        transaction_id: successData.transaction.id,
        vpa: vpaToUse,
      });
      setPayoutResult(res.data.payout);
    } catch (e) {
      alert(e.response?.data?.message || 'Payout simulation failed');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleSendReceipt = async (targetLang = receiptLang) => {
    if (!successData) return;
    try {
      setReceiptSending(true);
      const res = await api.post('/notifications/receipt/dispatch', {
        transaction_id: successData.transaction?.id,
        collector_phone: handoverData?.collector?.phone || handoverData?.lot?.collector?.phone || '9876543210',
        collector_name: handoverData?.collector?.name || handoverData?.lot?.collector?.name || 'Kabadiwala Partner',
        reference: successData.handover_reference || reference,
        cpcb_code: successData.epr_log?.material_cpcb_code || 'ITEW1',
        material_name: handoverData?.lot?.category || 'Printed Circuit Boards',
        net_weight_kg: successData.transaction?.total_weight_kg,
        purity: purity,
        amount: successData.transaction?.final_price_inr,
        payment_mode: successData.transaction?.payment_mode,
        utr: payoutResult?.utr || successData.transaction?.upi_utr || 'NA',
        recycler_name: 'Kabadify Central Recyclers Pvt Ltd',
        cpcb_reg_no: successData.epr_log?.cpcb_reg_no || 'CPCB-REG-2024-MH-0042',
        audit_hash_short: successData.epr_log?.audit_hash ? successData.epr_log.audit_hash.slice(0, 16) + '...' : 'N/A',
        lang: targetLang,
      });

      if (res.data.success) {
        setReceiptResult(res.data);
        if (res.data.whatsapp_url) {
          window.open(res.data.whatsapp_url, '_blank');
        }
      }
    } catch (err) {
      console.error('Failed to dispatch receipt notification:', err);
    } finally {
      setReceiptSending(false);
    }
  };

  // Build audio announcement text for scale weight & payout
  const buildWeightPayoutSpeech = () => {
    const pureKg = (parseFloat(finalWeight || 0) * (purity / 100)).toFixed(2);
    if (lang === 'hi') {
      return `कांटे पर कुल वजन ${finalWeight || 0} किलोग्राम है। शुद्धता ${purity} प्रतिशत के अनुसार प्रमाणित शुद्ध वजन ${pureKg} किलोग्राम है। कुल भुगतान राशि ${finalPrice || 0} रुपये है।`;
    }
    if (lang === 'mr') {
      return `काट्यावरील एकूण वजन ${finalWeight || 0} किलोग्रॅम आहे. शुद्धता ${purity} टक्के प्रमाणे प्रमाणित वजन ${pureKg} किलोग्रॅम आहे. एकूण देय रक्कम ${finalPrice || 0} रुपये आहे.`;
    }
    return `Scale weight is ${finalWeight || 0} kilograms. Effective pure weight is ${pureKg} kilograms at ${purity} percent purity. Total final payout is ${finalPrice || 0} rupees.`;
  };

  // Success view
  if (successData) {
    const successSpeech = lang === 'hi'
      ? `हैंडओवर सफलतापूर्वक सत्यापित हो गया है। कुल प्रमाणित वजन ${successData.transaction?.total_weight_kg} किलोग्राम है। भुगतान राशि ${successData.transaction?.final_price_inr} रुपये है। सीपीसीबी फॉर्म-6 प्रमाण पत्र तैयार है।`
      : lang === 'mr'
      ? `हस्तांतरण यशस्वीरित्या प्रमाणित झाले आहे. एकूण वजन ${successData.transaction?.total_weight_kg} किलोग्रॅम आहे. पेमेंट रक्कम ${successData.transaction?.final_price_inr} रुपये आहे. सीपीसीबी फॉर्म-6 प्रमाणपत्र तयार आहे.`
      : `Handover verified successfully. Certified weight is ${successData.transaction?.total_weight_kg} kilograms. Payout amount is ${successData.transaction?.final_price_inr} rupees. CPCB Form-6 certificate generated.`;

    return (
      <Box sx={{ py: 3, maxWidth: 720, mx: 'auto', color: '#0F172A' }}>
        <Paper elevation={0} sx={{ p: 4, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#16A34A', mb: 1 }} />
          <Typography variant="h4" fontWeight="800" sx={{ color: '#0F172A', letterSpacing: -0.3 }}>
            {t('weighbridge.successTitle', 'Handover Verified & Certified')}
          </Typography>
          <Typography variant="body1" sx={{ color: '#475569', mt: 0.8, fontSize: '0.98rem', fontWeight: 500 }}>
            {t('weighbridge.successSubtitle', 'E-Waste lot certified & recorded in CPCB Extended Producer Responsibility (EPR) ledger.')}
          </Typography>

          <Box sx={{ mt: 2, mb: 3 }}>
            <AudioReadoutButton
              text={successSpeech}
              label={lang === 'hi' ? 'सत्यापन विवरण सुनें' : lang === 'mr' ? 'पडताळणी तपशील ऐका' : 'Listen to Receipt Summary'}
              size="medium"
            />
          </Box>

          {/* Instant UPI Payout Card */}
          {successData.upi && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                my: 3,
                textAlign: 'center',
                bgcolor: '#F0FDF4',
                border: '2px solid #16A34A',
                borderRadius: 2.5,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.2} sx={{ mb: 1 }}>
                <FlashOnIcon sx={{ color: '#16A34A', fontSize: 26 }} />
                <Typography variant="h6" fontWeight="800" sx={{ color: '#14532D' }}>
                  {t('weighbridge.instantUpiTitle', 'Instant NPCI UPI Settlement')}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: '#166534', mb: 2.5, fontWeight: 500 }}>
                {t('weighbridge.scanQrInstruction', 'Scan with PhonePe, Google Pay, Paytm, or BHIM for real-time payout')}
              </Typography>

              <Box sx={{ display: 'inline-block', p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, mb: 2.5, border: '1px solid #BBF7D0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(successData.upi.dynamic_qr_string)}`}
                  alt="Dynamic UPI QR Code"
                  style={{ width: 180, height: 180, display: 'block' }}
                />
              </Box>

              <Box sx={{ maxWidth: 440, mx: 'auto', mb: 2.5, bgcolor: '#FFFFFF', p: 2, borderRadius: 2, border: '1px solid #BBF7D0' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.8, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography variant="body2" color="#64748B">{t('weighbridge.payee', 'Payee')}:</Typography>
                  <Typography variant="body2" fontWeight="700" color="#0F172A">Kabadify Recycling Escrow</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.8, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography variant="body2" color="#64748B">{t('weighbridge.transferAmount', 'Transfer Amount')}:</Typography>
                  <Typography variant="h6" fontWeight="800" sx={{ color: '#15803D', fontFamily: 'monospace' }}>₹{successData.upi.amount}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.8 }}>
                  <Typography variant="body2" color="#64748B">{t('weighbridge.bankUtr', 'Bank Reference (UTR)')}:</Typography>
                  <Chip
                    label={payoutResult?.utr || successData.upi.upi_utr || 'UTR-PENDING'}
                    size="small"
                    sx={{ fontWeight: 800, fontFamily: 'monospace', bgcolor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}
                  />
                </Stack>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                <Button
                  variant="outlined"
                  href={successData.upi.dynamic_qr_string}
                  target="_blank"
                  sx={{
                    fontWeight: 700,
                    borderColor: '#CBD5E1',
                    color: '#0F172A',
                    bgcolor: '#FFFFFF',
                    '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
                  }}
                >
                  {t('weighbridge.openUpiLink', 'Open UPI App Link')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleInstantUpiPayout}
                  disabled={payoutLoading || !!payoutResult}
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#1D4ED8',
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: '#1E40AF' },
                  }}
                >
                  {payoutLoading ? <CircularProgress size={20} color="inherit" /> : (payoutResult ? `✓ ${t('weighbridge.payoutSettled', 'Payout Settled')}` : t('weighbridge.executePayout', 'Execute Instant Bank Payout'))}
                </Button>
              </Stack>

              {payoutResult && (
                <Alert severity="success" sx={{ mt: 2.5, textAlign: 'left', bgcolor: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC' }}>
                  <strong>Instant Settlement Completed:</strong> ₹{payoutResult.amount} credited to {payoutResult.vpa}. Bank UTR: <code>{payoutResult.utr}</code>
                </Alert>
              )}
            </Paper>
          )}

          {/* Manifest Card */}
          <Paper elevation={0} sx={{ p: 3, my: 3, textAlign: 'left', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#1D4ED8', letterSpacing: 0.8 }} gutterBottom>
              {t('weighbridge.cpcbManifest', 'CPCB EPR TRANSACTION MANIFEST')}
            </Typography>
            <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('weighbridge.cpcbCode', 'CPCB Code')}</Typography>
                <Typography variant="body1" fontWeight="700" color="#0F172A">{successData.epr_log?.material_cpcb_code || 'ITEW1'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('common.weight', 'Confirmed Net Weight')}</Typography>
                <Typography variant="body1" fontWeight="700" color="#0F172A">{successData.transaction?.total_weight_kg} kg</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('common.payout', 'Final Payout Amount')}</Typography>
                <Typography variant="body1" fontWeight="700" sx={{ color: '#15803D' }}>₹{successData.transaction?.final_price_inr}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('common.status', 'Payment Status')}</Typography>
                <Typography variant="body2" fontWeight="700" color="#15803D">
                  {successData.transaction?.payment_mode === 'UPI' ? 'Instant UPI (Settled)' : 'Cash Disbursed'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="#64748B">CPCB Authorization Reg No.</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 600 }}>{successData.epr_log?.cpcb_reg_no || 'CPCB-REG-2024-MH-0042'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="#64748B">SHA-256 Audit Signature</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: '#F1F5F9', p: 1.2, borderRadius: 1.5, color: '#334155', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                  {successData.epr_log?.audit_hash || '7d4a5b9c...f4a1'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Vernacular WhatsApp & SMS Receipt Gateway */}
          <Paper elevation={0} sx={{ p: 3, my: 3, textAlign: 'left', bgcolor: '#FFFFFF', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <WhatsAppIcon sx={{ color: '#16A34A', fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A' }}>
                    {t('weighbridge.vernacularGateway', 'Automated Vernacular Receipt Gateway')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {t('weighbridge.receiptSubtitle', 'Instant WhatsApp delivery & Carrier DLT SMS to Collector')}
                  </Typography>
                </Box>
              </Stack>

              <ToggleButtonGroup
                size="small"
                value={receiptLang}
                exclusive
                onChange={(e, val) => val && setReceiptLang(val)}
                sx={{
                  bgcolor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  '& .MuiToggleButton-root': {
                    color: '#475569',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    '&.Mui-selected': { bgcolor: '#1D4ED8', color: '#FFFFFF' },
                  },
                }}
              >
                <ToggleButton value="hi">हिन्दी</ToggleButton>
                <ToggleButton value="mr">मराठी</ToggleButton>
                <ToggleButton value="en">English</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={() => handleSendReceipt(receiptLang)}
                disabled={receiptSending}
                sx={{
                  bgcolor: '#16A34A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#15803D' },
                }}
              >
                {receiptSending ? <CircularProgress size={20} color="inherit" /> : 'WhatsApp Receipt'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={() => setCertModalOpen(true)}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  py: 1.2,
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
                }}
              >
                {t('weighbridge.form6Cert', 'CPCB Form-6 Certificate')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  py: 1.2,
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
                }}
              >
                {t('weighbridge.printSlip', 'Quick Print Slip')}
              </Button>
            </Stack>

            {receiptResult && (
              <Alert severity="success" sx={{ mt: 2, bgcolor: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC' }}>
                {receiptResult.message || 'Receipt dispatched via WhatsApp and Carrier SMS'}
              </Alert>
            )}
          </Paper>

          {/* Form-6 Certificate Modal */}
          <CPCBForm6CertificateModal
            open={certModalOpen}
            onClose={() => setCertModalOpen(false)}
            certificate={{
              certificate_number: `CPCB/EPR/FORM6/2026/${successData.transaction?.id?.slice(0, 8).toUpperCase() || 'TX-001'}`,
              statutory_act: 'E-Waste (Management) Rules, 2022 (Schedule II, Form-6)',
              issuing_authority: 'Central Pollution Control Board (CPCB), Govt of India',
              issuance_timestamp: new Date().toISOString(),
              recycler: {
                company_name: 'Kabadify Central Recyclers Pvt Ltd',
                cpcb_authorization: successData.epr_log?.cpcb_reg_no || 'CPCB-REG-2024-MH-0042',
                spcb_noc: 'MPCB/RO-HQ/E-WASTE/AUTH-2023/0091',
                facility_address: 'Plot 42, MIDC Industrial Area, Taloja, Navi Mumbai, Maharashtra 410208',
              },
              lot_manifest: {
                transaction_id: successData.transaction?.id,
                material_cpcb_code: successData.epr_log?.material_cpcb_code || 'ITEW1',
                material_category: handoverData?.lot?.category || 'Printed Circuit Boards',
                claimed_weight_kg: parseFloat(handoverData?.weight_at_handover_kg || finalWeight),
                confirmed_net_weight_kg: parseFloat(successData.transaction?.total_weight_kg || finalWeight),
                purity_percentage: purity,
                effective_pure_yield_kg: (parseFloat(successData.transaction?.total_weight_kg || finalWeight) * (purity / 100)).toFixed(2),
              },
              settlement: {
                payout_amount_inr: parseFloat(successData.transaction?.final_price_inr || finalPrice),
                payment_mode: successData.transaction?.payment_mode || paymentMode,
                bank_utr: payoutResult?.utr || successData.transaction?.upi_utr || 'UTR-SETTLED',
                collector_anonymized_id: handoverData?.collector?.id?.slice(0, 16) || 'SECURE_HASH',
              },
              verification: {
                audit_hash_sha256: successData.epr_log?.audit_hash || '7d4a5b9c...f4a1',
                verification_url: `https://cpcb.kabadconnect.in/verify/${successData.epr_log?.audit_hash || '7d4a5b9c'}`,
              },
            }}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => {
              setSuccessData(null);
              setHandoverData(null);
              setReference('');
              setQrToken('');
              setPayoutResult(null);
            }}
            sx={{
              py: 1.5,
              bgcolor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {t('weighbridge.verifyAnother', 'Verify Another Lot')}
          </Button>
        </Paper>
      </Box>
    );
  }

  // Intake workflow form
  return (
    <Box maxWidth={780} sx={{ color: '#0F172A' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <ScaleIcon sx={{ color: '#1D4ED8', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="800" sx={{ color: '#0F172A', letterSpacing: -0.3 }}>
          {t('weighbridge.title', 'CPCB E-Waste Intake & Handover Verification')}
        </Typography>
      </Stack>
      <Typography sx={{ color: '#475569', mb: 3, fontSize: '0.98rem', fontWeight: 500 }}>
        {t('weighbridge.subtitle', 'Verify informal collector lot via Web Camera QR scanner or 8-character reference code to certify net weight and log EPR compliance.')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Step 1: Scanner or Code */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
        <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A', mb: 2, fontSize: '1.05rem' }}>
          {t('weighbridge.step1Title', 'Step 1: Scan Collector QR Code or Enter Reference')}
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          <Button
            variant={showScanner ? "outlined" : "contained"}
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setShowScanner(!showScanner)}
            sx={{
              bgcolor: showScanner ? 'transparent' : '#1D4ED8',
              borderColor: '#CBD5E1',
              color: showScanner ? '#0F172A' : '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.92rem',
              py: 1,
              px: 2.5,
              '&:hover': { bgcolor: showScanner ? '#F8FAFC' : '#1E40AF' },
            }}
          >
            {showScanner ? t('weighbridge.closeCamera', 'Close Camera') : t('weighbridge.openCamera', 'Open Camera Scanner')}
          </Button>
        </Box>

        {showScanner && (
          <Box sx={{ mb: 3, border: '2px dashed #1D4ED8', p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label={t('weighbridge.refCodeLabel', 'Handover Reference Code')}
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            inputProps={{ maxLength: 16, style: { fontFamily: 'monospace', fontSize: 22, letterSpacing: 4, fontWeight: 800, color: '#0F172A' } }}
            placeholder={t('weighbridge.refCodePlaceholder', 'KC3F8A2B')}
            helperText={t('weighbridge.refHelper', '8-character alphanumeric code shown on collector mobile app')}
            fullWidth
            sx={{
              bgcolor: '#F8FAFC',
              borderRadius: 2,
              '& .MuiFormHelperText-root': { color: '#64748B' },
            }}
          />
          <Button
            variant="contained"
            onClick={() => lookupReference()}
            disabled={loading || reference.length < 6}
            sx={{
              height: 56,
              minWidth: 130,
              bgcolor: '#1D4ED8',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.98rem',
              '&:hover': { bgcolor: '#1E40AF' },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('weighbridge.lookupBtn', 'Lookup')}
          </Button>
        </Box>
      </Paper>

      {/* Step 2 & 3: Comparison & Purity Inputs */}
      {handoverData && (
        <>
          <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A', mb: 2, fontSize: '1.05rem' }}>
              {t('weighbridge.step2Title', 'Step 2: Compare Collector Claims vs Verified Specifications')}
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('weighbridge.materialCat', 'Material Category')}</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <CategoryVisualBadge category={handoverData.lot?.category || 'PCB'} size="medium" />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('weighbridge.cpcbCode', 'CPCB Classification Code')}</Typography>
                <Typography variant="body1" fontWeight="800" sx={{ color: '#1D4ED8', fontSize: '1.1rem', mt: 0.5 }}>
                  {handoverData.lot?.cpcb_code || 'ITEW1'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('weighbridge.claimedWeight', 'Collector Claimed Weight')}</Typography>
                <Typography variant="body1" fontWeight="800" color="#0F172A" sx={{ fontSize: '1.1rem' }}>
                  {handoverData.weight_at_handover_kg || handoverData.lot?.approximate_weight_kg || '—'} kg
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#64748B">{t('weighbridge.quotedRate', 'Original Quoted Rate')}</Typography>
                <Typography variant="body1" fontWeight="800" sx={{ color: '#15803D', fontSize: '1.1rem' }}>
                  ₹{handoverData.transaction?.quoted_price_inr || handoverData.lot?.estimated_value_inr || '—'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Step 3: Scale Weight & Purity */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A', fontSize: '1.05rem' }}>
                {t('weighbridge.step3Title', 'Step 3: Actual Scale Measurement & Purity Deduction')}
              </Typography>
              <AudioReadoutButton
                text={buildWeightPayoutSpeech()}
                label={t('weighbridge.listenPayout', 'Listen to Weight & Payout')}
                size="small"
              />
            </Stack>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('weighbridge.scaleWeightLabel', 'Confirmed Scale Weight (kg)')}
                  type="number"
                  value={finalWeight}
                  onChange={(e) => setFinalWeight(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0.01, step: 0.1, style: { fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' } }}
                  helperText={t('weighbridge.scaleWeightHelper', 'Actual calibrated net weight measured on facility scale')}
                  sx={{ bgcolor: '#F8FAFC', borderRadius: 2, '& .MuiFormHelperText-root': { color: '#64748B' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('weighbridge.payoutLabel', 'Total Final Payout (₹)')}
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0, style: { fontSize: '1.25rem', fontWeight: 800, color: '#15803D' } }}
                  helperText={t('weighbridge.payoutHelper', 'Calculated or adjusted total compensation')}
                  sx={{ bgcolor: '#F8FAFC', borderRadius: 2, '& .MuiFormHelperText-root': { color: '#64748B' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#475569', mb: 1, fontWeight: 600 }}>
                  {t('weighbridge.purityGrade', 'Material Purity Grade / Deduction')}: <strong style={{ color: '#1D4ED8' }}>{purity}% Net Pure Yield</strong>
                </Typography>
                <Slider
                  value={purity}
                  onChange={(e, val) => setPurity(val)}
                  valueLabelDisplay="auto"
                  min={50}
                  max={100}
                  marks={[
                    { value: 60, label: '60% (Mixed)' },
                    { value: 80, label: '80% (Grade B)' },
                    { value: 95, label: '95% (Standard)' },
                    { value: 100, label: '100% (Clean)' },
                  ]}
                  sx={{
                    color: '#1D4ED8',
                    '& .MuiSlider-markLabel': { color: '#64748B', fontSize: '0.8rem', fontWeight: 600 },
                    '& .MuiSlider-thumb': { bgcolor: '#1D4ED8' },
                  }}
                />
              </Grid>
            </Grid>

            {finalWeight && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                <Typography variant="body1" sx={{ color: '#15803D', fontWeight: 700 }}>
                  {t('weighbridge.effectiveYield', 'Effective EPR Certified Net Pure Weight')}:{' '}
                  <span style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: 800 }}>
                    {(parseFloat(finalWeight) * (purity / 100)).toFixed(2)} kg
                  </span>
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Step 4: Payout Mode */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A', mb: 2, fontSize: '1.05rem' }}>
              {t('weighbridge.step4Title', 'Step 4: Select Collector Payout Method')}
            </Typography>
            <RadioGroup
              row
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="UPI"
                control={<Radio sx={{ color: '#64748B', '&.Mui-checked': { color: '#1D4ED8' } }} />}
                label={
                  <Box sx={{ ml: 0.5 }}>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <FlashOnIcon sx={{ color: '#1D4ED8', fontSize: 20 }} />
                      <Typography variant="body1" fontWeight="700" color="#0F172A">
                        {t('weighbridge.upiPayout', 'Instant UPI Payout / Dynamic QR')}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {t('weighbridge.upiPayoutDesc', 'Real-time bank settlement via PhonePe, GPay, Paytm, BHIM')}
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="Cash"
                control={<Radio sx={{ color: '#64748B', '&.Mui-checked': { color: '#1D4ED8' } }} />}
                label={
                  <Box sx={{ ml: 0.5 }}>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <PaymentsIcon sx={{ color: '#15803D', fontSize: 20 }} />
                      <Typography variant="body1" fontWeight="700" color="#0F172A">
                        {t('weighbridge.cashPayout', 'Cash Settlement')}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {t('weighbridge.cashPayoutDesc', 'Physical cash disbursed at weighbridge counter')}
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            {paymentMode === 'UPI' && (
              <TextField
                label={t('weighbridge.vpaLabel', 'Collector UPI ID / VPA (Optional)')}
                placeholder="7355217358@upi"
                value={collectorVpa}
                onChange={(e) => setCollectorVpa(e.target.value)}
                fullWidth
                helperText={t('weighbridge.vpaHelper', 'Leave blank to generate on-screen dynamic QR code for collector to scan')}
                sx={{
                  bgcolor: '#F8FAFC',
                  borderRadius: 2,
                  mt: 1,
                  '& .MuiFormHelperText-root': { color: '#64748B' },
                  '& input': { color: '#0F172A', fontWeight: 600 },
                }}
              />
            )}
          </Paper>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={verifyAndConfirm}
            disabled={confirming || !finalWeight}
            startIcon={<VerifiedUserIcon />}
            sx={{
              py: 1.8,
              bgcolor: '#15803D',
              color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(21, 128, 61, 0.25)',
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: 2.5,
              '&:hover': { bgcolor: '#166534' },
            }}
          >
            {confirming ? <CircularProgress size={24} color="inherit" /> : t('weighbridge.certifyBtn', 'Certify & Complete EPR Handover')}
          </Button>
        </>
      )}
    </Box>
  );
}
