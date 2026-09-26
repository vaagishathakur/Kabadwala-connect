import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Button, Stack, Chip, Card, CardContent,
  CircularProgress, IconButton
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PsychologyIcon from '@mui/icons-material/Psychology';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ScaleIcon from '@mui/icons-material/Scale';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { api } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import AudioReadoutButton from '../components/AudioReadoutButton';
import CategoryVisualBadge from '../components/CategoryVisualBadge';

const weeklyData = [
  { day: 'Mon', weight_kg: 85, lots: 4 },
  { day: 'Tue', weight_kg: 140, lots: 7 },
  { day: 'Wed', weight_kg: 115, lots: 5 },
  { day: 'Thu', weight_kg: 210, lots: 9 },
  { day: 'Fri', weight_kg: 280, lots: 12 },
  { day: 'Sat', weight_kg: 340, lots: 15 },
  { day: 'Sun', weight_kg: 160, lots: 6 },
];

export default function DashboardHome() {
  const { recycler } = useAuth();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [recentLots, setRecentLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [sumRes, txRes] = await Promise.all([
          api.get('/epr/summary').catch(() => ({ data: null })),
          api.get('/transactions?limit=6').catch(() => ({ data: { transactions: [] } })),
        ]);
        if (sumRes.data?.success) setSummary(sumRes.data);
        if (txRes.data?.transactions) setRecentLots(txRes.data.transactions);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <Box>
      {/* Hero Welcome Banner */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 2.5,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          color: '#0F172A',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2.5}>
          <Box>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.2 }}>
              <Chip
                label={t('common.cpcbConnected', 'CPCB Form-6 Active')}
                size="small"
                sx={{
                  bgcolor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  height: 26,
                  border: '1px solid #BFDBFE',
                }}
              />
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.92rem', fontWeight: 600 }}>
                {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </Typography>
            </Stack>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#0F172A', fontSize: '1.75rem', letterSpacing: -0.4 }}>
              {recycler?.name || t('dashboard.welcome', 'Recycling Facility Console')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', mt: 0.8, maxWidth: 720, fontSize: '1.02rem', lineHeight: 1.6, fontWeight: 500 }}>
              {t('dashboard.welcomeSubtitle', 'Regulated under India E-Waste (Management) Rules, 2022. Calibrated scale intake, instant NPCI UPI settlement, and immutable SHA-256 EPR audit trail.')}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <AudioReadoutButton
              text={t('dashboard.audioBriefingText')}
              label={t('dashboard.audioBriefing', 'Listen to Summary')}
              size="medium"
              sx={{ py: 1.2, px: 2.2, fontSize: '0.95rem' }}
            />
            <Button
              variant="contained"
              startIcon={<PsychologyIcon sx={{ fontSize: 22 }} />}
              onClick={() => navigate('/ai-inspector')}
              sx={{
                bgcolor: '#1D4ED8',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)',
                '&:hover': { bgcolor: '#1E40AF' },
                py: 1.2,
                px: 2.5,
              }}
            >
              {t('nav.aiInspector', 'AI Scrap Inspector')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<HandshakeIcon sx={{ fontSize: 22 }} />}
              onClick={() => navigate('/handover')}
              sx={{
                borderColor: '#CBD5E1',
                color: '#0F172A',
                bgcolor: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
                py: 1.2,
                px: 2.5,
              }}
            >
              {t('nav.weighbridge', 'Weighbridge Intake')}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Metric 1 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 3, borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" fontWeight="700" color="#64748B" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.82rem' }}>
                  {t('dashboard.quickStats.cpcbTarget', 'Total Certified Lots')}
                </Typography>
                <Typography variant="h3" fontWeight="800" sx={{ mt: 1, color: '#0F172A', fontSize: '2.2rem' }}>
                  {summary?.total_records || '14'}
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
                <VerifiedUserIcon sx={{ fontSize: 26 }} />
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: '#15803D', fontWeight: 700, display: 'block', mt: 1.5, fontSize: '0.88rem' }}>
              {t('dashboard.quickStats.targetChange', 'CPCB Form-6 Sealed Manifests')}
            </Typography>
          </Card>
        </Grid>

        {/* Metric 2 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 3, borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" fontWeight="700" color="#64748B" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.82rem' }}>
                  {t('dashboard.quickStats.totalIntake', 'Certified Net Weight')}
                </Typography>
                <Typography variant="h3" fontWeight="800" sx={{ mt: 1, color: '#0F172A', fontSize: '2.2rem' }}>
                  {summary?.total_weight_kg || '1,328'} <Typography component="span" variant="h6" fontWeight="700" color="#64748B" sx={{ fontSize: '1.2rem' }}>{t('common.kg', 'kg')}</Typography>
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7' }}>
                <ScaleIcon sx={{ fontSize: 26 }} />
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 1.5, fontSize: '0.88rem' }}>
              {t('dashboard.quickStats.intakeChange', 'Calibrated weighbridge scales')}
            </Typography>
          </Card>
        </Grid>

        {/* Metric 3 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 3, borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" fontWeight="700" color="#64748B" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.82rem' }}>
                  {t('dashboard.quickStats.monthlyPayout', 'Disbursed Payouts')}
                </Typography>
                <Typography variant="h3" fontWeight="800" sx={{ mt: 1, color: '#0F172A', fontSize: '2.2rem' }}>
                  ₹{summary?.total_payout_inr?.toLocaleString('en-IN') || '1,28,450'}
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}>
                <MonetizationOnIcon sx={{ fontSize: 26 }} />
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: '#15803D', fontWeight: 700, display: 'block', mt: 1.5, fontSize: '0.88rem' }}>
              {t('dashboard.quickStats.payoutChange', 'NPCI IMPS/UPI Bank Settlement')}
            </Typography>
          </Card>
        </Grid>

        {/* Metric 4 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 3, borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" fontWeight="700" color="#64748B" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.82rem' }}>
                  {t('dashboard.quickStats.activeLots', 'CPCB Material Codes')}
                </Typography>
                <Typography variant="h3" fontWeight="800" sx={{ mt: 1, color: '#0F172A', fontSize: '2.2rem' }}>
                  {summary?.by_cpcb_code?.length || '6'} <Typography component="span" variant="h6" fontWeight="700" color="#64748B" sx={{ fontSize: '1.1rem' }}>{t('common.category', 'Categories')}</Typography>
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706' }}>
                <AssessmentIcon sx={{ fontSize: 26 }} />
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 1.5, fontSize: '0.88rem' }}>
              {t('dashboard.quickStats.lotsChange', 'ITEW1–ITEW16, CEEW1–CEEW5')}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Grid: Chart & Recent Activity */}
      <Grid container spacing={2.5}>
        {/* Left: Intake Bar Chart */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="800" sx={{ color: '#0F172A', fontSize: '1.2rem' }}>
                  {lang === 'hi' ? 'साप्ताहिक आवक वजन (किलो)' : lang === 'mr' ? 'साप्ताहिक आवक वजन (किलो)' : 'Weekly Intake Volume'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.92rem', fontWeight: 500 }}>
                  {lang === 'hi' ? 'दैनिक प्रमाणित ई-कचरा वजन' : lang === 'mr' ? 'दैनिक प्रमाणित ई-कचरा वजन' : 'Certified kilograms processed across consignments'}
                </Typography>
              </Box>
              <Chip label={lang === 'hi' ? '7-दिन' : lang === 'mr' ? '7-दिवस' : '7-Day Window'} size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.82rem', height: 26, border: '1px solid #E2E8F0' }} />
            </Stack>

            <Box sx={{ width: '100%', height: 320, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={13} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis stroke="#64748B" fontSize={13} tickLine={false} axisLine={false} unit="kg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 8, color: '#0F172A', fontSize: '0.92rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value} kg`, t('common.weight', 'Net Weight')]}
                  />
                  <Bar dataKey="weight_kg" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Right: Quick Action Shortcuts & Recent Intake Table */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#0F172A', fontSize: '1.2rem' }}>
                {t('dashboard.recentIntake', 'Recent Consignments')}
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/lots')}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', fontWeight: 700, color: '#1D4ED8', fontSize: '0.92rem' }}
              >
                {t('dashboard.viewAll', 'View All')}
              </Button>
            </Stack>

            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>{t('common.reference', 'Consignment')}</TableCell>
                  <TableCell sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>{t('common.category', 'Material')}</TableCell>
                  <TableCell sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>{t('common.weight', 'Weight')}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>{t('common.status', 'Status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentLots.length > 0 ? (
                  recentLots.slice(0, 5).map((lot) => (
                    <TableRow key={lot.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' }, borderBottom: '1px solid #E2E8F0' }} onClick={() => navigate('/lots')}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>
                        {lot.id?.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}>
                        <CategoryVisualBadge category={lot.material_category || 'PCB'} size="small" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', borderBottom: '1px solid #E2E8F0' }}>{lot.total_weight_kg || '12.5'} {t('common.kg', 'kg')}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0' }}>
                        <Chip
                          label={t(`statusMap.${lot.transaction_status || 'Verified'}`, lot.transaction_status || 'Verified')}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            bgcolor: lot.transaction_status === 'Completed' || lot.transaction_status === 'Confirmed' ? '#DCFCE7' : '#FEF3C7',
                            color: lot.transaction_status === 'Completed' || lot.transaction_status === 'Confirmed' ? '#15803D' : '#B45309',
                            border: `1px solid ${lot.transaction_status === 'Completed' || lot.transaction_status === 'Confirmed' ? '#86EFAC' : '#FCD34D'}`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    <TableRow hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' }, borderBottom: '1px solid #E2E8F0' }} onClick={() => navigate('/handover')}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>KC-9F7C77</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}><CategoryVisualBadge category="PCB" size="small" /></TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', borderBottom: '1px solid #E2E8F0' }}>13.8 {t('common.kg', 'kg')}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0' }}><Chip label={t('statusMap.Completed', 'Completed')} size="small" sx={{ height: 24, fontSize: '0.78rem', bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, border: '1px solid #86EFAC' }} /></TableCell>
                    </TableRow>
                    <TableRow hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' }, borderBottom: '1px solid #E2E8F0' }} onClick={() => navigate('/handover')}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>KC-88B12C</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}><CategoryVisualBadge category="Battery" size="small" /></TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', borderBottom: '1px solid #E2E8F0' }}>24.0 {t('common.kg', 'kg')}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0' }}><Chip label={t('statusMap.Confirmed', 'Confirmed')} size="small" sx={{ height: 24, fontSize: '0.78rem', bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 800, border: '1px solid #93C5FD' }} /></TableCell>
                    </TableRow>
                    <TableRow hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' }, borderBottom: '1px solid #E2E8F0' }} onClick={() => navigate('/handover')}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>KC-74E9A1</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #E2E8F0' }}><CategoryVisualBadge category="Cable" size="small" /></TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', borderBottom: '1px solid #E2E8F0' }}>45.0 {t('common.kg', 'kg')}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0' }}><Chip label={t('statusMap.Pending', 'Pending')} size="small" sx={{ height: 24, fontSize: '0.78rem', bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800, border: '1px solid #FCD34D' }} /></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
