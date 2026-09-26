// src/pages/RateManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, TextField, Alert,
  CircularProgress, Chip, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import { api } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import CategoryVisualBadge from '../components/CategoryVisualBadge';
import AudioReadoutButton from '../components/AudioReadoutButton';

const CATEGORIES = ['PCB', 'Cable', 'Battery', 'CRT', 'LCD', 'Motor', 'Plastic', 'Mixed', 'Other'];

const MARKET_RANGES = {
  PCB:     { low: 80,  high: 140 },
  Cable:   { low: 280, high: 450 },
  Battery: { low: 15,  high: 50  },
  CRT:     { low: 5,   high: 18  },
  LCD:     { low: 30,  high: 70  },
  Motor:   { low: 40,  high: 90  },
  Plastic: { low: 5,   high: 22  },
  Mixed:   { low: 10,  high: 40  },
  Other:   { low: 10,  high: 35  },
};

export default function RateManagement() {
  const { lang, t, CATEGORY_DATA } = useLanguage();
  const [rates, setRates] = useState({});
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    try {
      const recycler = JSON.parse(localStorage.getItem('kc_recycler') || '{}');
      if (recycler.id) {
        const res = await api.get(`/recyclers/${recycler.id}`);
        setRates(res.data?.recycler?.offered_rates || {});
      }
    } catch {
      setRates({});
    }
    setLoading(false);
  };

  const startEdit = (cat) => {
    setEditing(cat);
    setEditValue(rates[cat]?.toString() || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveRate = async () => {
    if (!editValue || parseFloat(editValue) <= 0) {
      setError(t('rates.enterRate', 'Enter a valid rate'));
      return;
    }
    setSaving(true);
    setError(null);
    const newRates = { ...rates, [editing]: parseFloat(editValue) };
    try {
      const recycler = JSON.parse(localStorage.getItem('kc_recycler') || '{}');
      await api.patch(`/recyclers/${recycler.id}`, { offered_rates: newRates });
      setRates(newRates);
      const catLabel = CATEGORY_DATA[editing]?.[lang] || editing;
      setSuccess(
        t('rates.successUpdate', `Rate for ${catLabel} updated to ₹${editValue}/kg`)
          .replace('{category}', catLabel)
          .replace('{rate}', editValue)
      );
      setEditing(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const buildSpeechText = (cat, rate, range) => {
    const catLabel = CATEGORY_DATA[cat]?.[lang] || cat;
    if (lang === 'hi') {
      return rate
        ? `${catLabel} का आज का खरीद भाव ${rate} रुपये प्रति किलो है। बाजार का भाव ${range.low} से ${range.high} रुपये के बीच है।`
        : `${catLabel} का भाव अभी निर्धारित नहीं है। बाजार का भाव ${range.low} से ${range.high} रुपये है।`;
    }
    if (lang === 'mr') {
      return rate
        ? `${catLabel} चा आजचा खरेदी भाव ${rate} रुपये प्रति किलो आहे. बाजाराचा भाव ${range.low} ते ${range.high} रुपयांच्या दरम्यान आहे.`
        : `${catLabel} चा भाव अजून ठरलेला नाही. बाजाराचा भाव ${range.low} ते ${range.high} रुपये आहे.`;
    }
    return rate
      ? `Rate for ${catLabel} is ${rate} rupees per kilogram. Market range is ${range.low} to ${range.high} rupees.`
      : `Rate for ${catLabel} is not set. Market range is ${range.low} to ${range.high} rupees.`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ color: '#0F172A' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PriceChangeIcon sx={{ color: '#1D4ED8', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="800" sx={{ color: '#0F172A', letterSpacing: -0.3 }}>
              {t('rates.title', 'Facility Buying Rates Board')}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: '#475569', mt: 0.5, fontSize: '0.98rem', fontWeight: 500 }}>
            {t('rates.subtitle', 'Set and manage facility scrap purchase rates per kilogram. Visual categories and audio readouts assist operators and collectors.')}
          </Typography>
        </Box>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2.5, bgcolor: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>
                {t('rates.tableCategory', 'Material & Scrap Type')}
              </TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>
                {t('rates.tableYourRate', 'Your Buying Rate (₹/kg)')}
              </TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>
                {t('rates.tableMarketRange', 'MCX / Market Range (₹/kg)')}
              </TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>
                {t('rates.tableStatus', 'Competitiveness')}
              </TableCell>
              <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid #E2E8F0' }}>
                {t('rates.tableAction', 'Actions & Audio')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CATEGORIES.map((cat) => {
              const marketRange = MARKET_RANGES[cat];
              const myRate = rates[cat];
              const isEditing = editing === cat;
              const isCompetitive = myRate && myRate >= (marketRange.low + marketRange.high) / 2;
              const speechText = buildSpeechText(cat, myRate, marketRange);

              return (
                <TableRow
                  key={cat}
                  hover
                  sx={{
                    '&:hover': { bgcolor: '#F8FAFC' },
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #E2E8F0', py: 1.8 }}>
                    <CategoryVisualBadge category={cat} showCode size="medium" />
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                    {isEditing ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        inputProps={{ min: 1, step: 1 }}
                        sx={{
                          width: 140,
                          bgcolor: '#F8FAFC',
                          borderRadius: 1.5,
                          '& input': {
                            color: '#0F172A',
                            fontWeight: 800,
                            fontSize: '1.05rem',
                          },
                        }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveRate()}
                      />
                    ) : (
                      <Typography
                        variant="h6"
                        fontWeight="800"
                        sx={{
                          color: myRate ? '#15803D' : '#64748B',
                          fontFamily: 'monospace',
                          fontSize: '1.2rem',
                        }}
                      >
                        {myRate ? `₹ ${myRate} /kg` : t('common.pending', 'Not set')}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                    <Typography variant="body1" sx={{ color: '#334155', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      ₹{marketRange.low} – ₹{marketRange.high} /kg
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                    {myRate ? (
                      <Chip
                        label={isCompetitive ? t('common.competitive', 'Competitive') : t('common.belowAverage', 'Below Avg')}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          bgcolor: isCompetitive ? '#DCFCE7' : '#FEF3C7',
                          color: isCompetitive ? '#15803D' : '#B45309',
                          border: `1px solid ${isCompetitive ? '#86EFAC' : '#FCD34D'}`,
                        }}
                      />
                    ) : (
                      <Chip
                        label={t('common.pending', 'Not set')}
                        size="small"
                        sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}
                      />
                    )}
                  </TableCell>

                  <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0' }}>
                    <Stack direction="row" spacing={1.2} justifyContent="flex-end" alignItems="center">
                      {/* Audio speak rate button for illiterate or vernacular collectors */}
                      <AudioReadoutButton
                        text={speechText}
                        label={t('rates.listenRate', 'Listen')}
                        size="small"
                      />

                      {isEditing ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={saveRate}
                            disabled={saving}
                            sx={{
                              bgcolor: '#15803D',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              '&:hover': { bgcolor: '#166534' },
                            }}
                          >
                            {saving ? '...' : t('common.save', 'Save')}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={cancelEdit}
                            sx={{
                              borderColor: '#CBD5E1',
                              color: '#64748B',
                              '&:hover': { bgcolor: '#F1F5F9' },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 18 }} />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                          onClick={() => startEdit(cat)}
                          sx={{
                            borderColor: '#CBD5E1',
                            color: '#0F172A',
                            bgcolor: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            '&:hover': {
                              borderColor: '#1D4ED8',
                              bgcolor: '#EFF6FF',
                              color: '#1D4ED8',
                            },
                          }}
                        >
                          {t('common.editRate', 'Edit')}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
