import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, Typography, Paper, Alert, Chip, Stack,
  CircularProgress, Divider, Grid
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FloatingIVRWidget from '../components/FloatingIVRWidget';
import useAuth from '../hooks/useAuth';
import { api } from '../api/client';

export default function RecyclerLoginPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setStep(2);
    } catch (err) {
      setStep(2); // Demo fallback
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(phone, otp || '123456');
      if (user) {
        navigate('/');
      } else {
        setError('Login failed. Please enter demo OTP: 123456');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Demo OTP is 123456');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Left Side - Branding & Info (Hidden on small screens) */}
      <Grid item xs={12} md={5} lg={6} sx={{ 
        display: { xs: 'none', md: 'flex' }, 
        flexDirection: 'column', 
        bgcolor: '#FFFFFF', // White background so the logo looks perfect
        color: '#0F172A',
        p: 6,
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid #E2E8F0'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%',
          background: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0) 50%)',
          zIndex: 0
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 8 }}>
            <img src="/kabadify-logo.png" alt="Kabadify Logo" style={{ height: 60 }} />
          </Box>
          
          <Typography variant="h3" fontWeight="700" sx={{ mb: 3, lineHeight: 1.2, fontSize: { md: '2.5rem', lg: '3rem' }, color: '#0F172A' }}>
            The Operating System for Formal Recycling
          </Typography>
          
          <Typography variant="h6" sx={{ color: '#475569', mb: 6, fontWeight: 400, lineHeight: 1.6, maxWidth: 500 }}>
            Source verified e-waste directly from informal collectors. Fulfill your CPCB EPR quotas with full traceability and instant payouts.
          </Typography>

          <Stack spacing={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <VerifiedUserIcon sx={{ color: '#2563EB', mt: 0.5, fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="600" color="#0F172A">EPR Compliance Ready</Typography>
                <Typography variant="body2" color="#475569">Automated Form-6 generation and CPCB traceability logs.</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <AnalyticsIcon sx={{ color: '#10B981', mt: 0.5, fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="600" color="#0F172A">AI Material Inspection</Typography>
                <Typography variant="body2" color="#475569">Computer vision verifies incoming scrap quality before it arrives.</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <LocalShippingIcon sx={{ color: '#F59E0B', mt: 0.5, fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="600" color="#0F172A">Direct Collector Network</Typography>
                <Typography variant="body2" color="#475569">Connect directly with a network of verified collectors.</Typography>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Grid>

      {/* Right Side - Login Form */}
      <Grid item xs={12} md={7} lg={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 440, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)' }}>
          
          {/* Mobile Logo (Only visible on small screens) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mb: 4 }}>
            <img src="/kabadify-logo.png" alt="Kabadify Logo" style={{ height: 40 }} />
          </Box>

          <Typography variant="h5" fontWeight="700" sx={{ color: '#0F172A', mb: 1 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 4 }}>
            Sign in to access your Recycler Dashboard
          </Typography>

          <Alert severity="info" icon={<SecurityIcon fontSize="inherit" />} sx={{ mb: 4, borderRadius: 2, bgcolor: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE', '& .MuiAlert-icon': { color: '#3B82F6' } }}>
            <strong>Demo Gateway:</strong> Instant login enabled. Demo OTP is <strong>123456</strong>
          </Alert>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {step === 1 ? (
            <Box component="form" onSubmit={handleSendOtp} sx={{ width: '100%' }}>
              <Typography variant="subtitle2" sx={{ color: '#334155', mb: 1, fontWeight: 600 }}>
                Registered Mobile Number
              </Typography>
              <TextField
                required
                fullWidth
                id="phone"
                name="phone"
                autoComplete="tel"
                autoFocus
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ 
                  mb: 2, 
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' }
                }}
              />

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, fontWeight: 500 }}>
                Demo Authorized Facilities:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="9876543210 (Demo Facility)"
                  onClick={() => setPhone('9876543210')}
                  sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 600, '&:hover': { bgcolor: '#E2E8F0' } }}
                />
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                disableElevation
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem',
                  bgcolor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#334155' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerify} sx={{ width: '100%' }}>
              <Box sx={{ p: 2, mb: 3, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="#64748B" sx={{ display: 'block' }}>
                    Passcode sent to
                  </Typography>
                  <Typography variant="body2" fontWeight="600" color="#0F172A">
                    +91 {phone}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => setStep(1)} sx={{ fontWeight: 600, color: '#2563EB' }}>
                  Edit
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#334155', mb: 1, fontWeight: 600 }}>
                Enter 6-Digit OTP
              </Typography>
              <TextField
                required
                fullWidth
                id="otp"
                name="otp"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputProps={{ style: { letterSpacing: '0.5em', fontWeight: 'bold', fontSize: '1.25rem', textAlign: 'center' } }}
                sx={{ 
                  mb: 4, 
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                disableElevation
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem',
                  bgcolor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#334155' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate'}
              </Button>
            </Box>
          )}

          <Divider sx={{ width: '100%', my: 4 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>SECURE CPCB PORTAL</Typography>
          </Divider>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <VerifiedUserIcon sx={{ fontSize: 18, color: '#10B981' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              End-to-End Encrypted & Audited
            </Typography>
          </Stack>
        </Paper>
      </Grid>
      
      {/* Floating Offline & Online IVR Hotline */}
      <FloatingIVRWidget />
    </Grid>
  );
}
