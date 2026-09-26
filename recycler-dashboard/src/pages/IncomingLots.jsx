// src/pages/IncomingLots.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, Select, MenuItem,
  FormControl, InputLabel, TablePagination, Alert, CircularProgress,
  Stack
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScaleIcon from '@mui/icons-material/Scale';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import StatusChip from '../components/StatusChip';
import CategoryVisualBadge from '../components/CategoryVisualBadge';
import { useLanguage } from '../i18n/LanguageContext';

export default function IncomingLots() {
  const navigate = useNavigate();
  const { lang, t, CATEGORY_DATA } = useLanguage();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const CATEGORIES = ['PCB', 'Cable', 'Battery', 'CRT', 'LCD', 'Motor', 'Plastic', 'Mixed', 'Other'];

  useEffect(() => { fetchLots(); }, []);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions?limit=100');
      setLots(res.data?.transactions || []);
    } catch (e) {
      setError(e.response?.data?.message || t('common.error', 'Failed to load lots'));
    }
    setLoading(false);
  };

  const handleAction = async (txId, status) => {
    setActionLoading(txId);
    try {
      await api.patch(`/transactions/${txId}`, { transaction_status: status });
      setLots((prev) => prev.map((l) => l.id === txId ? { ...l, transaction_status: status } : l));
    } catch (e) {
      alert(e.response?.data?.message || t('common.error', 'Action failed'));
    }
    setActionLoading(null);
  };

  const filtered = lots.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.transaction_status === filterStatus;
    const matchCat = filterCategory === 'all' || l.material_category === filterCategory;
    return matchStatus && matchCat;
  });

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ color: '#0F172A' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <InboxIcon sx={{ color: '#1D4ED8', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="800" sx={{ color: '#0F172A', letterSpacing: -0.3 }}>
          {t('nav.incomingLots', 'Incoming Lot Requests')}
        </Typography>
      </Stack>
      <Typography sx={{ color: '#475569', mb: 3, fontSize: '0.98rem', fontWeight: 500 }}>
        {lang === 'hi'
          ? 'कबाड़ी मित्रों द्वारा भेजे गए लॉट देखें, स्वीकार करें या वे-ब्रिज कांटा सत्यापन के लिए आगे बढ़ें।'
          : lang === 'mr'
          ? 'कबाडी मित्रांनी पाठवलेले लॉट पहा, स्वीकारा किंवा वे-ब्रिज काटा तपासणीसाठी पुढे जा.'
          : 'Review and confirm inbound e-waste lots from scrap collectors or proceed to dual-scale weighbridge intake.'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 170, bgcolor: '#FFFFFF', borderRadius: 2 }}>
          <InputLabel sx={{ color: '#475569', fontWeight: 600 }}>{t('common.status', 'Status')}</InputLabel>
          <Select
            value={filterStatus}
            label={t('common.status', 'Status')}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ color: '#0F172A', fontWeight: 600, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' } }}
          >
            <MenuItem value="all">{lang === 'hi' ? 'सभी स्थितियाँ' : lang === 'mr' ? 'सर्व स्थिती' : 'All Statuses'}</MenuItem>
            {['Created','Matched','Confirmed','Completed','Cancelled'].map((s) => (
              <MenuItem key={s} value={s}>{t(`statusMap.${s}`, s)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#FFFFFF', borderRadius: 2 }}>
          <InputLabel sx={{ color: '#475569', fontWeight: 600 }}>{t('common.category', 'Category')}</InputLabel>
          <Select
            value={filterCategory}
            label={t('common.category', 'Category')}
            onChange={(e) => setFilterCategory(e.target.value)}
            sx={{ color: '#0F172A', fontWeight: 600, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' } }}
          >
            <MenuItem value="all">{lang === 'hi' ? 'सभी श्रेणियां' : lang === 'mr' ? 'सर्व श्रेणी' : 'All Categories'}</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{CATEGORY_DATA[c]?.[lang] || c}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>{t('common.reference', 'Reference ID')}</TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>{t('common.category', 'Material Category')}</TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>{t('common.weight', 'Weight')}</TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>{t('common.price', 'Quoted Price')}</TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>{t('common.status', 'Status')}</TableCell>
              <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>{t('common.actions', 'Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row) => (
              <TableRow
                key={row.id}
                hover
                onClick={() => navigate(`/lots/${row.id}`)}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' }, borderBottom: '1px solid #E2E8F0' }}
              >
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>
                  {row.id?.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                  <CategoryVisualBadge category={row.material_category || 'PCB'} size="small" />
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', borderBottom: '1px solid #E2E8F0' }}>
                  {row.total_weight_kg} {t('common.kg', 'kg')}
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.95rem', borderBottom: '1px solid #E2E8F0' }}>
                  ₹{row.quoted_price_inr?.toFixed(2)}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                  <StatusChip status={row.transaction_status} />
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ borderBottom: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    {['Created','Matched'].includes(row.transaction_status) && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          disabled={actionLoading === row.id}
                          onClick={() => handleAction(row.id, 'Confirmed')}
                          sx={{ bgcolor: '#15803D', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#166534' } }}
                        >
                          {actionLoading === row.id ? '...' : t('common.accept', 'Accept')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          disabled={actionLoading === row.id}
                          onClick={() => handleAction(row.id, 'Cancelled')}
                          sx={{ borderColor: '#FCA5A5', color: '#DC2626', bgcolor: '#FEF2F2', fontWeight: 700, '&:hover': { bgcolor: '#FEE2E2', borderColor: '#EF4444' } }}
                        >
                          {t('common.decline', 'Decline')}
                        </Button>
                      </>
                    )}
                    {row.transaction_status === 'Confirmed' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ScaleIcon />}
                        onClick={() => navigate('/handover', {
                          state: {
                            reference: row.id?.slice(0, 8).toUpperCase(),
                            transaction_id: row.id,
                            lot: {
                              id: row.material_id,
                              category: row.material_category,
                              approximate_weight_kg: row.total_weight_kg,
                              estimated_value_inr: row.quoted_price_inr,
                            }
                          }
                        })}
                        sx={{ bgcolor: '#1D4ED8', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#1E40AF' } }}
                      >
                        {t('weighbridge.title', 'Confirm Handover')}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!paginated.length && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748B' }}>
                  {lang === 'hi' ? 'कोई लॉट नहीं मिला' : lang === 'mr' ? 'कोणताही लॉट आढळला नाही' : 'No lots found matching your filters.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        sx={{ color: '#475569', '& .MuiTablePagination-selectIcon': { color: '#475569' } }}
      />
    </Box>
  );
}
