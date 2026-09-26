import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  Stack,
  Switch,
  FormControlLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CellTowerIcon from '@mui/icons-material/CellTower';
import { api } from '../api/client';

export default function IVRSimulator() {
  const [calling, setCalling] = useState(false);
  const [callId, setCallId] = useState(null);
  const [stage, setStage] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [language, setLanguage] = useState('hi');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callerPhone, setCallerPhone] = useState('7355217358');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (calling) {
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [calling]);

  const speakPrompt = (text, lang) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (lang === 'en') {
      utterance.lang = 'en-IN';
    } else {
      utterance.lang = 'hi-IN';
    }
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartCall = async () => {
    setLoading(true);
    setHistory([]);
    try {
      const res = await api.post('/ivr/simulator', {
        caller: callerPhone,
      });
      const data = res.data.response;
      setCallId(res.data.callId);
      setStage(data.stage);
      setLanguage(data.language || 'hi');
      setPromptText(data.prompt);
      setCalling(true);
      setHistory([{ sender: 'saathi', text: data.prompt, stage: data.stage }]);
      speakPrompt(data.prompt, data.language || 'hi');
    } catch (err) {
      alert('Failed to connect to IVR backend. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendDigit = async (digit) => {
    if (!calling || !callId || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/ivr/simulator', {
        callId,
        digits: String(digit),
        caller: callerPhone,
      });
      const data = res.data.response;
      setStage(data.stage);
      if (data.language) setLanguage(data.language);
      setPromptText(data.prompt);
      setHistory((prev) => [
        ...prev,
        { sender: 'user', text: `Pressed: ${digit}` },
        { sender: 'saathi', text: data.prompt, stage: data.stage },
      ]);
      speakPrompt(data.prompt, data.language || language);

      if (data.hangup) {
        setTimeout(() => handleEndCall(), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setCalling(false);
    setCallId(null);
    setStage(null);
    setPromptText('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          KabadConnect Saathi — IVR Voice Telephony
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Empowering informal Kabadiwalas with 24/7 feature phone access to daily CPCB rates & lot registration in <strong>Hindi</strong>, <strong>Marathi</strong>, and <strong>English</strong>.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Why IVR?</strong> In India, over 70% of informal scrap collectors use basic 2G feature phones without internet.
        KabadConnect Saathi bridges this digital divide by letting collectors dial a toll-free number to lock in formal CPCB recycler prices.
      </Alert>

      <Grid container spacing={3}>
        {/* Virtual Feature Phone */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={6}
            sx={{
              p: 3,
              bgcolor: '#1E293B',
              color: '#F8FAFC',
              borderRadius: 4,
              border: '3px solid #334155',
              maxWidth: 380,
              mx: 'auto',
            }}
          >
            {/* Phone Speaker & Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CellTowerIcon sx={{ fontSize: 18, color: '#10B981' }} />
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  KabadConnect Airtel/Jio 4G
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 'bold' }}>
                {calling ? formatTime(callDuration) : '1800-KABAD'}
              </Typography>
            </Box>

            {/* Virtual Screen Display */}
            <Box
              sx={{
                bgcolor: '#0F172A',
                p: 2.5,
                borderRadius: 2,
                minHeight: 180,
                border: '1px solid #475569',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              {calling ? (
                <>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        label={`IN CALL • ${language.toUpperCase()}`}
                        size="small"
                        color="success"
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                      <Typography variant="caption" sx={{ color: '#38BDF8' }}>
                        Stage: {stage || 'Init'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#F1F5F9',
                        fontFamily: 'monospace',
                        lineHeight: 1.5,
                        fontSize: '0.88rem',
                        mt: 1,
                      }}
                    >
                      {promptText}
                    </Typography>
                  </Box>
                  {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={16} sx={{ color: '#38BDF8' }} />
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Processing DTMF...
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', my: 'auto' }}>
                  <RecordVoiceOverIcon sx={{ fontSize: 48, color: '#64748B', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#CBD5E1' }}>
                    Toll-Free Helpline
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 'bold' }}>
                    1800-522-2326
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    (1800-KABAD-CON)
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Audio Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={audioEnabled}
                    onChange={(e) => setAudioEnabled(e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {audioEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                    Voice Synthesis
                  </Typography>
                }
              />
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Caller: {callerPhone}
              </Typography>
            </Box>

            {/* Keypad Grid */}
            <Box sx={{ px: 1 }}>
              {keypadKeys.map((row, rIdx) => (
                <Grid container spacing={1.5} key={rIdx} sx={{ mb: 1.5 }}>
                  {row.map((k) => (
                    <Grid item xs={4} key={k}>
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled={!calling || loading}
                        onClick={() => handleSendDigit(k)}
                        sx={{
                          py: 1.2,
                          color: '#F8FAFC',
                          borderColor: '#475569',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          bgcolor: '#334155',
                          '&:hover': {
                            bgcolor: '#475569',
                            borderColor: '#38BDF8',
                          },
                          '&:disabled': {
                            color: '#64748B',
                            borderColor: '#1E293B',
                            bgcolor: '#0F172A',
                          },
                        }}
                      >
                        {k}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              ))}

              {/* Call Controls */}
              <Box sx={{ mt: 2 }}>
                {!calling ? (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<PhoneInTalkIcon />}
                    onClick={handleStartCall}
                    disabled={loading}
                    sx={{ py: 1.4, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    {loading ? 'Connecting...' : 'Call 1800-KABAD (Saathi)'}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<CallEndIcon />}
                    onClick={handleEndCall}
                    sx={{ py: 1.4, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    End Call
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Live Conversation Transcript & Telephony Info */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Live Call Transcript */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Live Call Transcript & DTMF Events
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Real-time speech transcript between collector and KabadConnect Saathi IVR state machine.
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    maxHeight: 280,
                    overflowY: 'auto',
                    bgcolor: '#F8FAFC',
                    minHeight: 180,
                  }}
                >
                  {history.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 6 }}>
                      No active call. Click <strong>"Call 1800-KABAD"</strong> on the dialer to start an interactive voice session.
                    </Typography>
                  ) : (
                    <List dense>
                      {history.map((item, idx) => (
                        <ListItem key={idx} alignItems="flex-start" sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={item.sender === 'saathi' ? 'Saathi (IVR)' : 'Caller (DTMF)'}
                                  size="small"
                                  color={item.sender === 'saathi' ? 'primary' : 'secondary'}
                                  sx={{ fontSize: '0.7rem' }}
                                />
                                {item.stage && (
                                  <Typography variant="caption" color="text.secondary">
                                    [Stage: {item.stage}]
                                  </Typography>
                                )}
                              </Stack>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ mt: 0.5, color: '#1E293B', fontWeight: item.sender === 'user' ? 'bold' : 'normal' }}>
                                {item.text}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </CardContent>
            </Card>

            {/* Quick Testing Guide */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Test Flows (Try These!)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        1. English Pricing Check
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        • Call starts → Press <strong>3</strong> (English)<br />
                        • Main Menu → Press <strong>1</strong> (Scrap Prices)<br />
                        • Material → Press <strong>1</strong> (Motherboard/PCB)<br />
                        • Result: Hears live rate ₹450/kg!
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        2. Register Lot in Hindi
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        • Call starts → Press <strong>1</strong> (Hindi)<br />
                        • Main Menu → Press <strong>2</strong> (Sell e-waste)<br />
                        • Material → Press <strong>2</strong> (Mobile scrap)<br />
                        • Enter weight: <strong>25#</strong> → Scheduled!
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        3. Marathi Flow
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        • Call starts → Press <strong>2</strong> (Marathi)<br />
                        • Full Marathi voice prompts for Maharashtra scrap collectors!
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Telephony Architecture & Webhooks */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Telephony Webhooks & Architecture
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Inbound Voice Webhook (Twilio / Exotel):</Typography>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: '#F1F5F9', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      POST /api/ivr/voice
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">DTMF Input Handler Webhook:</Typography>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: '#F1F5F9', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      POST /api/ivr/input
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
