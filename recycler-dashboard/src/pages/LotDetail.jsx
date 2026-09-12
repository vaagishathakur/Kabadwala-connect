// src/pages/LotDetail.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { api } from '../api/client';
import StatusChip from '../components/StatusChip';

export default function LotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      setError(e.response?.data?.message || 'Failed to load lot details');
    }
    setLoading(false);
  };

  const handleAction = async (status) => {
    setActionLoading(status);
    try {
      await api.patch(`/transactions/${id}`, { transaction_status: status });
      setTx((prev) => ({ ...prev, transaction_status: status }));
      setSuccess(`Lot ${status === 'Confirmed' ? 'accepted' : 'declined'} successfully.`);
    } catch (e) {
      setError(e.response?.data?.message || 'Action failed');
    }
    setActionLoading(null);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!tx) return <Alert severity="warning">Transaction not found</Alert>;

  return (
    <Box maxWidth={800}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="text" onClick={() => navigate('/lots')}>← Back to Lots</Button>
        <Typography variant="h5" fontWeight="bold">Lot Detail</Typography>
        <StatusChip status={tx.transaction_status} />
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Material info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>📦 Material Details</Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              ['Lot ID', tx.lot_id?.slice(0, 8).toUpperCase()],
              ['Category', tx.material_category],
              ['Weight', `${tx.total_weight_kg} kg`],
              ['Collection Date', tx.collection_datetime ? new Date(tx.collection_datetime).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight="500">{value}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Pricing */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>💰 Pricing Details</Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              ['Quoted Price', `₹${tx.quoted_price_inr?.toFixed(2)}`],
              ['Final Price', tx.final_price_inr ? `₹${tx.final_price_inr.toFixed(2)}` : 'Pending'],
              ['Payment Mode', tx.payment_mode],
              ['Payment Status', ''],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                {label === 'Payment Status'
                  ? <StatusChip status={tx.payment_status} />
                  : <Typography variant="body2" fontWeight="500">{value}</Typography>}
              </Box>
            ))}
            {tx.anomaly_flag && (
              <Alert severity="warning" sx={{ mt: 2 }}>⚠️ Price anomaly detected by system. Verify before proceeding.</Alert>
            )}
          </Paper>
        </Grid>

        {/* Collector info (anonymised) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>👤 Collector (Anonymised)</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Collector ID</Typography>
            <Typography variant="body2" fontWeight="500">KC-{tx.collector_id?.slice(0, 8).toUpperCase()}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Action buttons */}
      {['Created', 'Matched'].includes(tx.transaction_status) && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained" color="success" size="large"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleAction('Confirmed')}
            disabled={!!actionLoading}
            sx={{ flex: 1 }}
          >
            {actionLoading === 'Confirmed' ? 'Accepting...' : 'Accept Lot'}
          </Button>
          <Button
            variant="outlined" color="error" size="large"
            startIcon={<CancelIcon />}
            onClick={() => handleAction('Cancelled')}
            disabled={!!actionLoading}
            sx={{ flex: 1 }}
          >
            {actionLoading === 'Cancelled' ? 'Declining...' : 'Decline Lot'}
          </Button>
        </Box>
      )}

      {tx.transaction_status === 'Confirmed' && (
        <Button
          variant="contained" fullWidth size="large" startIcon={<HandshakeIcon />}
          onClick={() => navigate('/handover')}
          sx={{ mt: 3, bgcolor: '#1B5E20' }}
        >
          Proceed to Confirm Handover
        </Button>
      )}
    </Box>
  );
}
