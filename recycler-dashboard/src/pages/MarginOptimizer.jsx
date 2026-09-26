import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, MenuItem, Slider,
  Button, Chip, Stack, Divider, Alert, Card, CardContent, CircularProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalculateIcon from '@mui/icons-material/Calculate';
import FactoryIcon from '@mui/icons-material/Factory';
import VerifiedIcon from '@mui/icons-material/Verified';
import SpeedIcon from '@mui/icons-material/Speed';
import { api } from '../api/client';

const CATEGORIES = [
  { value: 'PCB', label: 'Printed Circuit Boards (PCBs) - Gold/Silver/Copper/Tin' },
  { value: 'BATTERY', label: 'Lithium-Ion Scrap - Cobalt / Nickel Black Mass' },
  { value: 'CABLE', label: 'Copper Cables / Wire Harness - High-purity Copper' },
  { value: 'MOTOR', label: 'Electric Motors & Transformers - Copper & Silicon Steel' },
  { value: 'OTHER', label: 'Mixed Non-Ferrous Electronic Waste' },
];

export default function MarginOptimizer() {
  const [ticker, setTicker] = useState([]);
  const [tickerLoading, setTickerLoading] = useState(true);

  // Simulation form inputs
  const [category, setCategory] = useState('PCB');
  const [weightKg, setWeightKg] = useState(15);
  const [intakeRate, setIntakeRate] = useState(95);
  const [refiningCost, setRefiningCost] = useState(18);
  const [yieldPct, setYieldPct] = useState(90);

  // Simulation results
  const [simulation, setSimulation] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState(null);

  const fetchTicker = async () => {
    try {
      const res = await api.get('/prices/mcx-ticker');
      if (res.data?.success) {
        setTicker(res.data.ticker);
      }
    } catch (err) {
      console.warn('Ticker load failed:', err);
    } finally {
      setTickerLoading(false);
    }
  };

  const runSimulation = async () => {
    try {
      setSimLoading(true);
      const res = await api.post('/prices/margin-simulate', {
        category,
        lot_weight_kg: Number(weightKg),
        intake_rate_per_kg: Number(intakeRate),
        refining_cost_per_kg: Number(refiningCost),
        recovery_yield_pct: Number(yieldPct),
      });
      if (res.data?.success) {
        setSimulation(res.data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const handlePublishRate = async () => {
    try {
      setPublishing(true);
      setPublishMessage(null);
      await api.post('/prices', {
        material_category: category,
        buying_price_inr: Number(intakeRate),
        location_city: 'Mumbai',
        location_state: 'Maharashtra',
      });
      setPublishMessage(`Published ₹${intakeRate}/kg for ${category} to facility price board!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish rate');
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    fetchTicker();
    const timer = setInterval(fetchTicker, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    runSimulation();
  }, [category, weightKg, intakeRate, refiningCost, yieldPct]);

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.75rem', letterSpacing: -0.4 }}>
          <TrendingUpIcon sx={{ color: '#3B82F6', fontSize: 36 }} />
          Live MCX/LME Metal Ticker & Dynamic Margin Optimizer
        </Typography>
        <Typography variant="body1" sx={{ color: '#CBD5E1', fontSize: '1.02rem', mt: 0.5, maxWidth: 880 }}>
          Track real-time metal spot commodities and optimize buying prices to safeguard recycler refining margins under CPCB guidelines.
        </Typography>
      </Box>

      {/* Live Benchmark Grid */}
      <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#94A3B8', mb: 1.5, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.85rem' }}>
        LIVE TRADING BENCHMARKS (MCX / LME SPOT)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {tickerLoading ? (
          <Grid item xs={12} sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={28} sx={{ color: '#3B82F6' }} />
          </Grid>
        ) : (
          ticker.map((item) => {
            const isUp = item.change_pct >= 0;
            return (
              <Grid item xs={6} sm={4} md={3} key={item.symbol}>
                <Card elevation={0} sx={{ border: '1px solid #1E293B', borderLeft: `4px solid ${isUp ? '#10B981' : '#EF4444'}`, bgcolor: '#111726' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="700" sx={{ color: '#CBD5E1', fontSize: '0.92rem' }} noWrap>
                        {item.name}
                      </Typography>
                      <Chip
                        label={`${isUp ? '+' : ''}${item.change_pct}%`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isUp ? '#34D399' : '#F87171',
                          border: `1px solid ${isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      />
                    </Stack>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1, fontFamily: 'monospace', color: '#FFFFFF', fontSize: '1.35rem' }}>
                      ₹{item.price_inr.toLocaleString('en-IN')}
                      <Typography component="span" variant="caption" sx={{ color: '#94A3B8', fontSize: '0.85rem', ml: 0.5 }}>
                        /{item.unit}
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Simulator Section */}
      <Grid container spacing={3}>
        {/* Controls Card */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', bgcolor: '#111726', border: '1px solid #1E293B' }}>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.2, color: '#FFFFFF', fontSize: '1.15rem' }}>
              <CalculateIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
              Lot Intake & Refining Parameters
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                select
                label="Material Scrap Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value} sx={{ fontSize: '0.95rem' }}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Lot Scale Weight (kg)"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0))}
                fullWidth
                inputProps={{ min: 0.1, step: 0.5 }}
              />

              <TextField
                label="Collector Intake Rate Offered (₹/kg)"
                type="number"
                value={intakeRate}
                onChange={(e) => setIntakeRate(Math.max(0, parseFloat(e.target.value) || 0))}
                fullWidth
                helperText="Actual payout rate per kg agreed with informal collector"
              />

              <TextField
                label="Smelting / Refining Overhead (₹/kg)"
                type="number"
                value={refiningCost}
                onChange={(e) => setRefiningCost(Math.max(0, parseFloat(e.target.value) || 0))}
                fullWidth
                helperText="Acid leaching, electrolysis, energy, and safe disposal cost"
              />

              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.92rem', mb: 1 }}>
                  Chemical Extraction Recovery Yield: <strong style={{ color: '#38BDF8' }}>{yieldPct}%</strong>
                </Typography>
                <Slider
                  value={yieldPct}
                  onChange={(e, val) => setYieldPct(val)}
                  min={60}
                  max={98}
                  step={1}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 70, label: '70% Low' },
                    { value: 85, label: '85% Standard' },
                    { value: 95, label: '95% High' },
                  ]}
                  sx={{
                    color: '#2563EB',
                    '& .MuiSlider-markLabel': { color: '#94A3B8', fontSize: '0.82rem' },
                  }}
                />
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<SpeedIcon sx={{ fontSize: 20 }} />}
                  onClick={runSimulation}
                  disabled={simLoading}
                  sx={{ borderColor: '#334155', color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', py: 1.2, flex: 1 }}
                >
                  {simLoading ? <CircularProgress size={20} /> : 'Recalculate'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<MonetizationOnIcon sx={{ fontSize: 20 }} />}
                  onClick={handlePublishRate}
                  disabled={publishing}
                  sx={{
                    bgcolor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    py: 1.2,
                    border: '1px solid #1D4ED8',
                    flex: 1.5,
                    '&:hover': { bgcolor: '#1D4ED8' },
                  }}
                >
                  {publishing ? <CircularProgress size={20} color="inherit" /> : `Publish Rate`}
                </Button>
              </Stack>

              {publishMessage && (
                <Alert severity="success" onClose={() => setPublishMessage(null)} sx={{ mt: 1, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#6EE7B7', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  {publishMessage}
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Results Card */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', bgcolor: '#111726', border: '1px solid #1E293B' }}>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.2, color: '#FFFFFF', fontSize: '1.15rem' }}>
              <MonetizationOnIcon sx={{ color: '#10B981', fontSize: 24 }} />
              Yield Economics & Profit Margin Analysis
            </Typography>

            {simulation ? (
              <Box>
                {/* Profit Margin Banner */}
                <Box
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: '#162032',
                    border: `1.5px solid ${simulation.recovery_economics.profit_status === 'PROFITABLE' ? '#10B981' : '#EF4444'}`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        NET RECYCLER PROFIT MARGIN
                      </Typography>
                      <Typography
                        variant="h3"
                        fontWeight="800"
                        sx={{ color: simulation.recovery_economics.net_margin_inr >= 0 ? '#10B981' : '#EF4444', fontSize: '2.1rem', mt: 0.5 }}
                      >
                        ₹{simulation.recovery_economics.net_margin_inr.toLocaleString('en-IN')}
                        <Typography component="span" variant="h5" sx={{ ml: 1.5, fontWeight: 600, color: '#CBD5E1', fontSize: '1.25rem' }}>
                          ({simulation.recovery_economics.margin_percentage}%)
                        </Typography>
                      </Typography>
                    </Box>
                    <Chip
                      label={simulation.recovery_economics.profit_status}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        height: 32,
                        px: 1,
                        bgcolor: simulation.recovery_economics.profit_status === 'PROFITABLE' ? '#10B981' : '#EF4444',
                        color: '#fff',
                      }}
                    />
                  </Stack>
                </Box>

                {/* Cost vs Revenue Breakdown */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>Collector Payout</Typography>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.15rem', mt: 0.5 }}>₹{simulation.lot_summary.total_collector_payout}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>Processing Overhead</Typography>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.15rem', mt: 0.5 }}>₹{simulation.recovery_economics.processing_cost}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>CPCB Compliance Fee</Typography>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.15rem', mt: 0.5 }}>₹{simulation.recovery_economics.compliance_fee}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>Gross Extracted Value</Typography>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#10B981', fontSize: '1.15rem', mt: 0.5 }}>₹{simulation.recovery_economics.gross_recovered_revenue}</Typography>
                  </Grid>
                </Grid>

                {/* Recommended Ceiling Price Alert */}
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#93C5FD', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.92rem' }}>
                  <strong style={{ color: '#FFFFFF' }}>Smart Margin Guard:</strong> To maintain at least an <strong>18% net operating margin</strong> on this lot, your maximum buying price should be: <strong style={{ color: '#FFFFFF' }}>₹{simulation.recovery_economics.recommended_max_intake_rate} / kg</strong>.
                </Alert>

                <Divider sx={{ my: 2.5, borderColor: '#1E293B' }} />

                {/* Extracted Commodities Yield */}
                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#CBD5E1', fontSize: '0.95rem', mb: 1.5 }}>
                  Refined Metal Recovery Yield (from {weightKg} kg scrap):
                </Typography>
                <Grid container spacing={1.5}>
                  {simulation.yields.map((yld) => (
                    <Grid item xs={6} sm={3} key={yld.metal}>
                      <Box sx={{ p: 1.8, bgcolor: '#162032', border: '1px solid #1E293B', borderRadius: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>{yld.metal}</Typography>
                        <Typography variant="body1" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.02rem', mt: 0.3 }}>{yld.recovered_qty}</Typography>
                        <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.92rem' }}>₹{yld.value_inr}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CircularProgress size={36} sx={{ color: '#3B82F6' }} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
