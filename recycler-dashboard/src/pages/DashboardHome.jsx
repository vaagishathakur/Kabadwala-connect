import { Box, Grid, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAuth from '../hooks/useAuth';

const mockData = [
  { name: 'Mon', lots: 4 },
  { name: 'Tue', lots: 7 },
  { name: 'Wed', lots: 5 },
  { name: 'Thu', lots: 8 },
  { name: 'Fri', lots: 12 },
  { name: 'Sat', lots: 15 },
  { name: 'Sun', lots: 9 },
];

export default function DashboardHome() {
  const { recycler } = useAuth();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {recycler?.name || 'Recycler'}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography color="textSecondary" gutterBottom>Total Lots Today</Typography>
            <Typography component="p" variant="h4">12</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography color="textSecondary" gutterBottom>Pending Confirmations</Typography>
            <Typography component="p" variant="h4">5</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography color="textSecondary" gutterBottom>Weight Processed (Mo)</Typography>
            <Typography component="p" variant="h4">1,240 kg</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography color="textSecondary" gutterBottom>Payments Due</Typography>
            <Typography component="p" variant="h4">₹ 45,200</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 340 }}>
            <Typography variant="h6" gutterBottom>Lots Received (Last 7 Days)</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} margin={{ top: 16, right: 16, bottom: 0, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="lots" fill="#2e7d32" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 340 }}>
            <Typography variant="h6" gutterBottom>Recent Lots</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>KC-1042</TableCell><TableCell>PCB</TableCell><TableCell>Pending</TableCell></TableRow>
                <TableRow><TableCell>KC-1041</TableCell><TableCell>Mixed</TableCell><TableCell>Matched</TableCell></TableRow>
                <TableRow><TableCell>KC-1040</TableCell><TableCell>Cable</TableCell><TableCell>Completed</TableCell></TableRow>
                <TableRow><TableCell>KC-1039</TableCell><TableCell>Plastic</TableCell><TableCell>Completed</TableCell></TableRow>
                <TableRow><TableCell>KC-1038</TableCell><TableCell>Motor</TableCell><TableCell>Completed</TableCell></TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
