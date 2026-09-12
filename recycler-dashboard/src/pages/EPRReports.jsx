// src/pages/EPRReports.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { api } from '../api/client';

export default function EPRReports() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEPRData();
  }, []);

  const fetchEPRData = async () => {
    setLoading(true);
    try {
      const [sumRes, logsRes] = await Promise.all([
        api.get('/epr/summary'),
        api.get('/epr/logs?limit=25'),
      ]);
      setSummary(sumRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (e) {
      setError('Failed to load CPCB EPR compliance reports.');
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    window.open('http://localhost:3000/api/epr/export', '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <div>
          <Typography variant="h5" fontWeight="bold">
            <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#1B5E20' }} />
            CPCB Extended Producer Responsibility (EPR) Compliance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Auditable chain-of-custody manifests under the E-Waste (Management) Rules, 2022.
          </Typography>
        </div>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadCSV}
          sx={{ bgcolor: '#1B5E20', '&:hover': { bgcolor: '#2E7D32' }, fontWeight: 'bold' }}
        >
          Export CPCB Quarterly CSV Manifest
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" variant="caption">TOTAL AUDITED LOTS</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1B5E20">
                {summary?.total_records || logs.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Cryptographically verified handovers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" variant="caption">CERTIFIED NET RECYCLED WEIGHT</Typography>
              <Typography variant="h4" fontWeight="bold">
                {summary?.total_weight_kg || '0.00'} <Typography component="span" variant="h6">kg</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">Net of moisture/purity deductions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" variant="caption">TOTAL DISBURSED TO COLLECTORS</Typography>
              <Typography variant="h4" fontWeight="bold" color="#E65100">
                ₹{summary?.total_payout_inr?.toLocaleString('en-IN') || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Direct verified informal channel payouts</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CPCB Code Breakdown */}
      {summary?.by_cpcb_code?.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Breakdown by Central Pollution Control Board (CPCB) Code
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {summary.by_cpcb_code.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.code}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FAFAFA' }}>
                  <Chip label={item.code} size="small" color="primary" sx={{ mb: 1, fontWeight: 'bold' }} />
                  <Typography variant="body2" fontWeight="600">{item.category}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.total_weight_kg} kg certified</Typography>
                  <Typography variant="caption" color="text.secondary">₹{item.total_payout_inr} disbursed ({item.record_count} lots)</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Audit Log Table */}
      <Paper elevation={2}>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="600">
            Immutable Handover Audit Ledger
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F5F5F5' }}>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>CPCB Code</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Net Certified Wt</TableCell>
                <TableCell>Payout</TableCell>
                <TableCell>Anonymized Collector ID</TableCell>
                <TableCell>Tamper-Evident SHA-256 Audit Hash</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No verified EPR handover records found yet. Complete a handover intake to generate records.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{new Date(log.handover_timestamp).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell><Chip label={log.material_cpcb_code} size="small" variant="outlined" /></TableCell>
                    <TableCell>{log.material_category}</TableCell>
                    <TableCell><strong>{log.confirmed_net_weight_kg} kg</strong> ({log.purity_percentage}%)</TableCell>
                    <TableCell>₹{log.payout_amount_inr}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {log.collector_anonymized_id ? `${log.collector_anonymized_id.slice(0, 10)}...` : '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: '#1B5E20' }}>
                      {log.audit_hash ? `${log.audit_hash.slice(0, 16)}...` : 'VERIFIED'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
