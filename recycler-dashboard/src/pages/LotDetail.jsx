// src/pages/LotDetail.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip,
  CircularProgress, Alert, Divider, Stack
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { api } from '../api/client';
import StatusChip from '../components/StatusChip';
import CategoryVisualBadge from '../components/CategoryVisualBadge';
import AudioReadoutButton from '../components/AudioReadoutButton';
import { useLanguage } from '../i18n/LanguageContext';

export default function LotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/transactions/${id}`);
      setTx(res.data?.transaction);
    } catch (e) {
      setError(e.response?.data?.message || t('common.error', 'Failed to load lot details'));
    }
    setLoading(false);
  };

  const handleAction = async (status) => {
    setActionLoading(status);
    try {
      await api.patch(`/transactions/${id}`, { transaction_status: status });
      setTx((prev) => ({ ...prev, transaction_status: status }));
      setSuccess(status === 'Confirmed' ? 'Lot accepted successfully' : 'Lot declined');
    } catch (e) {
      setError(e.response?.data?.message || 'Action failed');
    }
    setActionLoading(null);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!tx) return <Alert severity="warning">Transaction not found</Alert>;

  const lotSpeech = lang === 'hi'
    ? `लॉट संख्या ${tx.id?.slice(0, 8)}. सामग्री ${tx.material_category}. कुल वजन ${tx.total_weight_kg} किलोग्राम. अनुमानित भाव ${tx.quoted_price_inr} रुपये. स्थिति ${tx.transaction_status}.`
    : lang === 'mr'
    ? `लॉट क्रमांक ${tx.id?.slice(0, 8)}. माल ${tx.material_category}. एकूण वजन ${tx.total_weight_kg} किलोग्रॅम. अंदाजे किंमत ${tx.quoted_price_inr} रुपये. स्थिती ${tx.transaction_status}.`
    : `Lot ID ${tx.id?.slice(0, 8)}. Material ${tx.material_category}. Weight ${tx.total_weight_kg} kg. Quoted price ${tx.quoted_price_inr} rupees. Status ${tx.transaction_status}.`;

  return (
    <Box maxWidth={820} sx={{ color: '#0F172A' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/lots')}
            sx={{ borderColor: '#CBD5E1', color: '#0F172A', bgcolor: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' } }}
          >
            {lang === 'hi' ? 'वापस जाएं' : lang === 'mr' ? 'मागे जा' : 'Back to Lots'}
          </Button>
          <Typography variant="h5" fontWeight="800" sx={{ color: '#0F172A' }}>
            {lang === 'hi' ? 'लॉट विवरण' : lang === 'mr' ? 'लॉट तपशील' : 'Lot Detail'}
          </Typography>
          <StatusChip status={tx.transaction_status} />
        </Stack>

        <AudioReadoutButton
          text={lotSpeech}
          label={lang === 'hi' ? 'लॉट विवरण सुनें' : lang === 'mr' ? 'लॉट तपशील ऐका' : 'Listen to Details'}
          size="small"
        />
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2.5, bgcolor: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Material info */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
              <Inventory2Icon sx={{ color: '#1D4ED8', fontSize: 24 }} />
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A' }}>
                {lang === 'hi' ? 'सामग्री विवरण' : lang === 'mr' ? 'भंगार तपशील' : 'Material Details'}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2, borderColor: '#E2E8F0' }} />
            
            <Box sx={{ mb: 2 }}>
              <CategoryVisualBadge category={tx.material_category || 'PCB'} showCode size="large" />
            </Box>

            {[
              [t('common.reference', 'Lot Reference ID'), tx.id?.slice(0, 8).toUpperCase()],
              [t('common.weight', 'Claimed Weight'), `${tx.total_weight_kg} kg`],
              [t('common.date', 'Collection Date'), tx.collection_datetime ? new Date(tx.collection_datetime).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN') : '—'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>{label}</Typography>
                <Typography variant="body2" fontWeight="800" sx={{ color: '#0F172A', fontFamily: label.includes('ID') ? 'monospace' : 'inherit' }}>{value}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Pricing */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
              <MonetizationOnIcon sx={{ color: '#15803D', fontSize: 24 }} />
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A' }}>
                {lang === 'hi' ? 'कीमत एवं भुगतान' : lang === 'mr' ? 'किंमत व पेमेंट' : 'Pricing Details'}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2, borderColor: '#E2E8F0' }} />

            {[
              [t('weighbridge.quotedRate', 'Quoted Rate'), `₹${tx.quoted_price_inr?.toFixed(2)}`],
              [t('weighbridge.payoutLabel', 'Final Price'), tx.final_price_inr ? `₹${tx.final_price_inr.toFixed(2)}` : t('common.pending', 'Pending')],
              ['Payment Mode', tx.payment_mode || 'UPI'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #E2E8F0', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>{label}</Typography>
                <Typography variant="body2" fontWeight="800" sx={{ color: label.includes('Price') || label.includes('Rate') ? '#15803D' : '#0F172A' }}>{value}</Typography>
              </Box>
            ))}

            {tx.anomaly_flag && (
              <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2, bgcolor: '#FFFBEB', color: '#92400E', border: '1px solid #FCD34D' }}>
                Price anomaly detected by system. Verify scale weight before proceeding.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Collector info (anonymised) */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PersonOutlineIcon sx={{ color: '#64748B', fontSize: 26 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  {lang === 'hi' ? 'कबाड़ी खाता (गुमनाम ID)' : lang === 'mr' ? 'कबाडी खाते (अनामित ID)' : 'Collector Account (Anonymised Hash)'}
                </Typography>
                <Typography variant="body1" fontWeight="800" sx={{ color: '#0F172A', fontFamily: 'monospace' }}>
                  KC-{tx.collector_id?.slice(0, 12).toUpperCase()}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Action buttons */}
      {['Created', 'Matched'].includes(tx.transaction_status) && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleAction('Confirmed')}
            disabled={!!actionLoading}
            sx={{ flex: 1, py: 1.4, bgcolor: '#15803D', color: '#FFFFFF', fontWeight: 800, '&:hover': { bgcolor: '#166534' } }}
          >
            {actionLoading === 'Confirmed' ? 'Accepting...' : t('common.accept', 'Accept Lot')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<CancelIcon />}
            onClick={() => handleAction('Cancelled')}
            disabled={!!actionLoading}
            sx={{ flex: 1, py: 1.4, borderColor: '#FCA5A5', color: '#DC2626', bgcolor: '#FEF2F2', fontWeight: 800, '&:hover': { bgcolor: '#FEE2E2', borderColor: '#EF4444' } }}
          >
            {actionLoading === 'Cancelled' ? 'Declining...' : t('common.decline', 'Decline Lot')}
          </Button>
        </Box>
      )}

      {tx.transaction_status === 'Confirmed' && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<HandshakeIcon />}
          onClick={() => navigate('/handover', {
            state: {
              reference: tx.id?.slice(0, 8).toUpperCase(),
              transaction_id: tx.id,
              lot: {
                id: tx.material_id,
                category: tx.material_category,
                approximate_weight_kg: tx.total_weight_kg,
                estimated_value_inr: tx.quoted_price_inr,
              }
            }
          })}
          sx={{
            mt: 3,
            bgcolor: '#1D4ED8',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1rem',
            py: 1.6,
            borderRadius: 2.5,
            boxShadow: '0 4px 14px rgba(29, 78, 216, 0.25)',
            '&:hover': { bgcolor: '#1E40AF' },
          }}
        >
          {t('weighbridge.title', 'Proceed to Confirm Handover')}
        </Button>
      )}
    </Box>
  );
}
