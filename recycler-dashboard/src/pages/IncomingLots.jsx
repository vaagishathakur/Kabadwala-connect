// src/pages/IncomingLots.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, Select, MenuItem,
  FormControl, InputLabel, TablePagination, Alert, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import StatusChip from '../components/StatusChip';
import { format } from 'date-fns';

export default function IncomingLots() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const CATEGORIES = ['CRT','LCD','PCB','Cable','Battery','Motor','Plastic','Mixed','Other'];

  useEffect(() => { fetchLots(); }, []);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const recycler = JSON.parse(localStorage.getItem('kc_recycler') || '{}');
      const res = await api.get('/transactions?limit=100');
      setLots(res.data?.transactions || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load lots');
    }
    setLoading(false);
  };

  const handleAction = async (txId, status) => {
    setActionLoading(txId);
    try {
      await api.patch(`/transactions/${txId}`, { transaction_status: status });
      setLots((prev) => prev.map((l) => l.id === txId ? { ...l, transaction_status: status } : l));
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    }
    setActionLoading(null);
  };

  const filtered = lots.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.transaction_status === filterStatus;
    const matchCat = filterCategory === 'all' || l.material_category === filterCategory;
    return matchStatus && matchCat;
  });

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>📦 Incoming Lot Requests</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {['Created','Matched','Confirmed','Completed','Cancelled'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select value={filterCategory} label="Category" onChange={(e) => setFilterCategory(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#1B5E20' }}>
            <TableRow>
              {['Reference ID','Category','Weight (kg)','Quoted Price','Status','Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row) => (
              <TableRow key={row.id} hover onClick={() => navigate(`/lots/${row.id}`)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">{row.id?.slice(0, 8).toUpperCase()}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={row.material_category} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{row.total_weight_kg} kg</TableCell>
                <TableCell>₹{row.quoted_price_inr?.toFixed(2)}</TableCell>
                <TableCell><StatusChip status={row.transaction_status} /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['Created','Matched'].includes(row.transaction_status) && (
                      <>
                        <Button
                          size="small" variant="contained" color="success"
                          disabled={actionLoading === row.id}
                          onClick={() => handleAction(row.id, 'Confirmed')}
                        >
                          {actionLoading === row.id ? '...' : 'Accept'}
                        </Button>
                        <Button
                          size="small" variant="outlined" color="error"
                          disabled={actionLoading === row.id}
                          onClick={() => handleAction(row.id, 'Cancelled')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {row.transaction_status === 'Confirmed' && (
                      <Button size="small" variant="contained" color="info" onClick={() => navigate('/handover')}>
                        Confirm Handover
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!paginated.length && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>
                  No lots found matching your filters.
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
      />
    </Box>
  );
}
