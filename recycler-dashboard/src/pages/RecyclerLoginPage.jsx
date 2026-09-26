import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, Typography, Paper, Alert, Chip, Stack,
  CircularProgress, Container, Divider
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
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
      // Demo fallback
      setStep(2);
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0B0F17',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            bgcolor: '#111726',
            border: '1px solid #1E293B',
            position: 'relative',
          }}
        >
          {/* Logo Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#162032',
                border: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <RecyclingIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1, fontSize: '1.45rem' }}>
                KabadConnect
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.78rem' }}>
                CPCB Recycler Terminal
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ color: '#CBD5E1', mb: 2.5, fontSize: '0.98rem' }} align="center">
            Extended Producer Responsibility Formal Intake Portal
          </Typography>

          <Alert
            severity="info"
            icon={<SecurityIcon fontSize="inherit" />}
            sx={{
              width: '100%',
              mb: 2.5,
              fontSize: '0.92rem',
              bgcolor: 'rgba(37, 99, 235, 0.12)',
              color: '#93C5FD',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              '& .MuiAlert-icon': { color: '#60A5FA', fontSize: 20 },
            }}
          >
            <strong>Demo Gateway:</strong> Instant login enabled. Demo OTP: <strong>123456</strong>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2.5, fontSize: '0.92rem' }}>
              {error}
            </Alert>
          )}

          {step === 1 ? (
            <Box component="form" onSubmit={handleSendOtp} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="phone"
                label="Registered Facility Mobile"
                name="phone"
                autoComplete="tel"
                autoFocus
                placeholder="e.g. 7355217358"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ mb: 1.5 }}
              />

              <Typography variant="body2" sx={{ color: '#CBD5E1', display: 'block', mt: 1, mb: 0.8, fontWeight: 600, fontSize: '0.88rem' }}>
                Demo Authorized Facilities:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 0.8 }}>
                <Chip
                  label="7355217358 (Owner Demo)"
                  size="small"
                  onClick={() => setPhone('7355217358')}
                  sx={{ bgcolor: '#162032', color: '#FFFFFF', border: '1px solid #1E293B', fontWeight: 600, fontSize: '0.82rem', height: 28, cursor: 'pointer', '&:hover': { bgcolor: '#1E293B', borderColor: '#2563EB' } }}
                />
                <Chip
                  label="9820012345 (Attero Recycling)"
                  size="small"
                  onClick={() => setPhone('9820012345')}
                  sx={{ bgcolor: '#162032', color: '#FFFFFF', border: '1px solid #1E293B', fontWeight: 600, fontSize: '0.82rem', height: 28, cursor: 'pointer', '&:hover': { bgcolor: '#1E293B', borderColor: '#2563EB' } }}
                />
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: '1.0rem',
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  border: '1px solid #1D4ED8',
                  '&:hover': {
                    bgcolor: '#1D4ED8',
                  },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send One-Time Passcode'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerify} sx={{ width: '100%' }}>
              <Box sx={{ p: 1.5, mb: 2, bgcolor: '#0D131F', borderRadius: 1.5, border: '1px solid #1E293B' }}>
                <Typography variant="caption" color="#64748B" sx={{ display: 'block' }}>
                  Verifying Facility Passcode for:
                </Typography>
                <Typography variant="body2" fontWeight="600" color="#F8FAFC">
                  +91 {phone}
                </Typography>
              </Box>

              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Enter 6-Digit OTP"
                name="otp"
                autoFocus
                value={otp}
                helperText="Use demo OTP: 123456"
                onChange={(e) => setOtp(e.target.value)}
                inputProps={{ style: { letterSpacing: 4, fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' } }}
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  border: '1px solid #1D4ED8',
                  mb: 1.5,
                  '&:hover': {
                    bgcolor: '#1D4ED8',
                  },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Authenticate Facility'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={() => setStep(1)}
                sx={{ color: '#64748B', fontSize: '0.85rem', '&:hover': { color: '#F8FAFC' } }}
              >
                Change Phone Number
              </Button>
            </Box>
          )}

          <Divider sx={{ width: '100%', my: 2.5, borderColor: '#1E293B' }} />

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <VerifiedUserIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              MoEFCC & CPCB EPR Compliance Standard | Form-6
            </Typography>
          </Stack>
        </Paper>
      </Container>

      {/* Floating Offline & Online IVR Hotline */}
      <FloatingIVRWidget />
    </Box>
  );
}
