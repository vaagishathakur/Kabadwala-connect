import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material';
import useAuth from '../hooks/useAuth';

export default function RecyclerLoginPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = (e) => {
    e.preventDefault();
    if(phone.length >= 10) setStep(2);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const success = await login(phone, otp);
    if(success) {
      navigate('/');
    } else {
      alert('Invalid OTP for demo. Try 1234');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Typography component="h1" variant="h5" color="primary" gutterBottom>
            KabadConnect Recycler Portal
          </Typography>
          <Typography component="h2" variant="h6" gutterBottom>
            Sign In
          </Typography>
          
          {step === 1 ? (
            <Box component="form" onSubmit={handleSendOtp} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="phone"
                label="Phone Number"
                name="phone"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                Send OTP
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerify} sx={{ mt: 1, width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>OTP sent to {phone}</Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Enter OTP"
                name="otp"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                Verify & Login
              </Button>
              <Button fullWidth variant="text" onClick={() => setStep(1)}>
                Back
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
