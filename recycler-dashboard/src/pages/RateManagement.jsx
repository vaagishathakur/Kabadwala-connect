// src/pages/RateManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, TextField, Alert,
  CircularProgress, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { api } from '../api/client';

const CATEGORIES = ['CRT','LCD','PCB','Cable','Battery','Motor','Plastic','Mixed','Other'];

const MARKET_RANGES = {
  PCB:     { low: 80,  high: 140 }, Cable:   { low: 280, high: 450 },
  Battery: { low: 15,  high: 50  }, CRT:     { low: 5,   high: 18  },
  LCD:     { low: 30,  high: 70  }, Motor:   { low: 40,  high: 90  },
  Plastic: { low: 5,   high: 22  }, Mixed:   { low: 10,  high: 40  },
  Other:   { low: 10,  high: 35  },
};

export default function RateManagement() {
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
    } catch { setRates({}); }
    setLoading(false);
  };

  const startEdit = (cat) => {
    setEditing(cat);
    setEditValue(rates[cat]?.toString() || '');
  };

  const saveRate = async () => {
    if (!editValue || parseFloat(editValue) <= 0) { setError('Enter a valid rate'); return; }
    setSaving(true); setError(null);
    const newRates = { ...rates, [editing]: parseFloat(editValue) };
    try {
      const recycler = JSON.parse(localStorage.getItem('kc_recycler') || '{}');
      await api.patch(`/recyclers/${recycler.id}`, { offered_rates: newRates });
      setRates(newRates);
      setSuccess(`Rate for ${editing} updated to ₹${editValue}/kg`);
      setEditing(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>💰 Manage Offered Rates</Typography>
      <Typography color="text.secondary" mb={3}>
        Set your buying rates per kilogram for each material category. Market range is shown for reference.
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: '#1B5E20' }}>
            <TableRow>
              {['Material Category', 'Your Rate (₹/kg)', 'Market Range (₹/kg)', 'Status', 'Action'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {CATEGORIES.map((cat) => {
              const marketRange = MARKET_RANGES[cat];
              const myRate = rates[cat];
              const isEditing = editing === cat;
              const isCompetitive = myRate && myRate >= (marketRange.low + marketRange.high) / 2;

              return (
                <TableRow key={cat} hover>
                  <TableCell>
                    <Typography fontWeight="600">{cat}</Typography>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small" type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        inputProps={{ min: 1, step: 1 }}
                        sx={{ width: 120 }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveRate()}
                      />
                    ) : (
                      <Typography fontWeight="bold" color={myRate ? '#1B5E20' : '#999'}>
                        {myRate ? `₹${myRate}` : 'Not set'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      ₹{marketRange.low} – ₹{marketRange.high}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {myRate ? (
                      <Chip
                        label={isCompetitive ? 'Competitive ✓' : 'Below avg'}
                        color={isCompetitive ? 'success' : 'warning'}
                        size="small"
                      />
                    ) : <Chip label="Not set" size="small" />}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Button
                        size="small" variant="contained" startIcon={<SaveIcon />}
                        onClick={saveRate} disabled={saving}
                        sx={{ bgcolor: '#1B5E20' }}
                      >
                        {saving ? '...' : 'Save'}
                      </Button>
                    ) : (
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => startEdit(cat)}>
                        Edit
                      </Button>
                    )}
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
