// src/pages/TransactionHistory.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, TextField, CircularProgress,
  TablePagination, Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { api } from '../api/client';
import StatusChip from '../components/StatusChip';
import { format } from 'date-fns';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const res = await api.get('/transactions?limit=200');
      setTransactions(res.data?.transactions || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    }
    setLoading(false);
  };

  const filtered = transactions.filter((tx) => {
    const date = new Date(tx.collection_datetime || tx.createdAt);
    const after = startDate ? date >= new Date(startDate) : true;
    const before = endDate ? date <= new Date(endDate + 'T23:59:59') : true;
    return after && before;
  });

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Summary
  const totalWeight = filtered.reduce((s, t) => s + (parseFloat(t.total_weight_kg) || 0), 0);
  const totalValue = filtered.reduce((s, t) => s + (parseFloat(t.final_price_inr || t.quoted_price_inr) || 0), 0);

  const exportCSV = () => {
    const headers = ['ID','Category','Weight(kg)','Quoted(₹)','Final(₹)','Payment Mode','Status','Date'];
    const rows = filtered.map((t) => [
      t.id, t.material_category, t.total_weight_kg,
      t.quoted_price_inr, t.final_price_inr || '',
      t.payment_mode, t.transaction_status,
      format(new Date(t.collection_datetime || t.createdAt), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kabadconnect_transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">📊 Transaction History</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV}>Export CSV</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="From Date" type="date" size="small"
          value={startDate} onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ width: 180 }}
        />
        <TextField
          label="To Date" type="date" size="small"
          value={endDate} onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ width: 180 }}
        />
        <Button variant="text" size="small" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>
      </Box>

      {/* Summary row */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, p: 2, bgcolor: '#E8F5E9', borderRadius: 2 }}>
        <Box><Typography variant="caption" color="text.secondary">Total Transactions</Typography><Typography fontWeight="bold">{filtered.length}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Total Weight</Typography><Typography fontWeight="bold">{totalWeight.toFixed(2)} kg</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Total Value</Typography><Typography fontWeight="bold" color="success.main">₹{totalValue.toFixed(2)}</Typography></Box>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1B5E20' }}>
            <TableRow>
              {['Date','Lot ID','Category','Weight (kg)','Final Price','Payment','Status'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row) => {
              const statusColor = row.transaction_status === 'Completed' ? '#f1f8e9' : row.transaction_status === 'Cancelled' ? '#fafafa' : '#fff';
              return (
                <TableRow key={row.id} hover sx={{ bgcolor: statusColor }}>
                  <TableCell>{row.collection_datetime ? format(new Date(row.collection_datetime), 'dd/MM/yy') : '—'}</TableCell>
                  <TableCell><Typography variant="caption" fontFamily="monospace">{row.lot_id?.slice(0,8).toUpperCase()}</Typography></TableCell>
                  <TableCell>{row.material_category}</TableCell>
                  <TableCell>{row.total_weight_kg}</TableCell>
                  <TableCell>₹{(row.final_price_inr || row.quoted_price_inr || 0).toFixed(2)}</TableCell>
                  <TableCell><StatusChip status={row.payment_status} /></TableCell>
                  <TableCell><StatusChip status={row.transaction_status} /></TableCell>
                </TableRow>
              );
            })}
            {!paginated.length && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                  No transactions in selected date range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div" count={filtered.length} page={page} rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
      />
    </Box>
  );
}
