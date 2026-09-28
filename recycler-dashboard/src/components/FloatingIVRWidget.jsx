// src/components/FloatingIVRWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Stack, Chip,
  Divider, Tooltip, Badge, Collapse, Alert
} from '@mui/material';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CellTowerIcon from '@mui/icons-material/CellTower';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { api } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';

// Authentic DTMF Frequencies for Audio Feedback
const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

// Comprehensive Offline Fallback IVR Engine
const OFFLINE_PROMPTS = {
  welcome: {
    hi: 'कबाड़कनेक्ट टोल-फ्री IVR में आपका स्वागत है। हिंदी के लिए 1 दबाएं। मराठीसाठी 2 दाबा। For English, press 3.',
    mr: 'कबाडकनेक्ट टोल-फ्री IVR मध्ये आपले स्वागत आहे. मराठीसाठी 2 दाबा. हिंदीसाठी 1 दाबा. For English, press 3.',
    en: 'Welcome to Kabadify Toll-Free Voice Portal. Press 1 for Hindi, 2 for Marathi, 3 for English.',
  },
  main: {
    hi: 'कबाड़कनेक्ट सारथी मेनू: आज के लाइव स्क्रैप भाव जानने के लिए 1 दबाएं। अपना माल बेचने के लिए 2 दबाएं। नजदीकी CPCB रिसायकलर के लिए 3 दबाएं। भुगतान और बैंक UTR के लिए 4 दबाएं। सुरक्षा नियमों के लिए 5 दबाएं। भाषा बदलने के लिए 9 दबाएं।',
    mr: 'कबाडकनेक्ट सारथी मेनू: स्क्रॅपचे ताजे बाजारभाव जाणून घेण्यासाठी 1 दाबा. विक्री लॉट तयार करण्यासाठी 2 दाबा. जवळचे रिसायकलर शोधण्यासाठी 3 दाबा. पेमेंट स्टेटससाठी 4 दाबा. सुरक्षा नियमांसाठी 5 दाबा. भाषा बदलण्यासाठी 9 दाबा.',
    en: 'Kabadify Saathi Menu: Press 1 for live scrap market rates. Press 2 to sell scrap lot. Press 3 to find authorized recyclers. Press 4 for payout status. Press 5 for safety tips. Press 9 for language.',
  },
  prices: {
    hi: 'आज के बाज़ार भाव: पीसीबी ₹1,250 प्रति किलो, लिथियम बैटरी ₹92 प्रति किलो, तांबा तार ₹680 प्रति किलो, लोहा ₹28 प्रति किलो। मुख्य मेनू के लिए * दबाएं।',
    mr: 'आजचे दर: पीसीबी ₹1,250 प्रति किलो, लिथियम बॅटरी ₹92 प्रति किलो, तांबे ₹680 प्रति किलो, लोखंड ₹28 प्रति किलो. मुख्य मेनूसाठी * दाबा.',
    en: 'Today rates: PCB ₹1,250/kg, Lithium Battery ₹92/kg, Copper ₹680/kg, Iron ₹28/kg. Press * for main menu.',
  },
  sell: {
    hi: 'लॉट दर्ज करने के लिए सामग्री चुनें: पीसीबी के लिए 1, बैटरी के लिए 2, तांबे के लिए 3, प्लास्टिक के लिए 4 दबाएं। मुख्य मेनू के लिए * दबाएं।',
    mr: 'लॉट नोंदवण्यासाठी साहित्य निवडा: पीसीबीसाठी 1, बॅटरीसाठी 2, तांब्यासाठी 3 दाबा. मुख्य मेनूसाठी * दाबा.',
    en: 'Select scrap category: Press 1 for PCB, 2 for Battery, 3 for Copper. Press * for main menu.',
  },
  sell_confirmed: {
    hi: 'आपका लॉट दर्ज हो गया है! संदर्भ कोड है KC-7821। नज़दीकी CPCB केंद्र से संपर्क किया जा रहा है। मुख्य मेनू के लिए * दबाएं।',
    mr: 'तुमचा लॉट नोंदवला गेला आहे! रेफरन्स कोड KC-7821 आहे. जवळच्या केंद्राशी संपर्क साधला जात आहे. मुख्य मेनूसाठी * दाबा.',
    en: 'Your lot has been created! Reference code KC-7821. Connecting with nearest authorized recycler. Press * for main menu.',
  },
  recyclers: {
    hi: 'आपके पास 3 CPCB अधिकृत रिसायकलर हैं: 1. अट्टेरो रिसाइकलिंग (3.2 किमी), 2. इको-फ्रेंड वेइंग (5.1 किमी)। मुख्य मेनू के लिए * दबाएं।',
    mr: 'तुमच्याजवळ 3 अधिकृत रिसायकलर आहेत: अट्टेरो रिसायकलिंग (3.2 किमी). मुख्य मेनूसाठी * दाबा.',
    en: 'Found 3 CPCB certified recyclers nearby: Attero Recycling (3.2 km), Eco-Friend Weighbridge (5.1 km). Press * for main menu.',
  },
  payment: {
    hi: 'आपका अंतिम भुगतान ₹12,450 सफल रहा है। बैंक UTR: UTR-9823412091। यह राशि आपके UPI खाते में जमा कर दी गई है। मुख्य मेनू के लिए * दबाएं।',
    mr: 'आपले शेवटचे पेमेंट ₹12,450 यशस्वी झाले आहे. बँक UTR: UTR-9823412091. मुख्य मेनूसाठी * दाबा.',
    en: 'Your last payout of ₹12,450 is settled. Bank UTR: UTR-9823412091 credited via IMPS/UPI. Press * for main menu.',
  },
  safety: {
    hi: 'ई-वेस्ट सुरक्षा: लिथियम बैटरी को कभी न जलाएं। पीसीबी को एसिड में न धोएं। हमेशा दस्ताने पहनें। केवल अधिकृत CPCB केंद्र को ही माल दें। मुख्य मेनू के लिए * दबाएं।',
    mr: 'सुरक्षा सूचना: बॅटरी जाळू नका. पीसीबीवर ॲसिड वापरू नका. हातमोजे वापरा. फक्त अधिकृत केंद्रातच माल द्या. मुख्य मेनूसाठी * दाबा.',
    en: 'Safety Advisory: Never burn or puncture lithium batteries. Do not use acid leaching. Always wear PPE gloves. Channel e-waste only to CPCB authorized recyclers. Press * for main menu.',
  },
};

export default function FloatingIVRWidget() {
  const { lang: globalLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callId, setCallId] = useState(null);
  const [stage, setStage] = useState('welcome');
  const [promptText, setPromptText] = useState(OFFLINE_PROMPTS.welcome[globalLang || 'hi'] || OFFLINE_PROMPTS.welcome.hi);
  const [language, setLanguage] = useState(globalLang || 'hi');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (globalLang && !calling) {
      setLanguage(globalLang);
      setPromptText(OFFLINE_PROMPTS[stage]?.[globalLang] || OFFLINE_PROMPTS.welcome[globalLang]);
    }
  }, [globalLang, calling, stage]);

  // Call timer
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

  // Listen for global open-ivr events from any header or page button
  useEffect(() => {
    const handleOpenIVR = () => {
      setOpen(true);
    };
    window.addEventListener('open-ivr', handleOpenIVR);
    return () => window.removeEventListener('open-ivr', handleOpenIVR);
  }, []);


  // Audio tone generator for keypad
  const playDTMFTone = (digit) => {
    try {
      if (!audioEnabled) return;
      const freqs = DTMF_FREQS[digit];
      if (!freqs) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];
      gain.gain.value = 0.08;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
        } catch (e) {}
      }, 110);
    } catch (e) {}
  };

  // Vernacular Speech synthesis
  const speak = (text, lang = 'hi') => {
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
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  // Start Call (Tries API first, falls back to offline engine)
  const startCall = async () => {
    setLoading(true);
    setHistory([]);
    setCallDuration(0);
    try {
      const res = await api.post('/ivr/simulator', {
        caller: '7355217358',
      }, { timeout: 3500 });
      const data = res.data.response;
      setCallId(res.data.callId);
      setStage(data.stage || 'main');
      const lang = data.language || 'hi';
      setLanguage(lang);
      setPromptText(data.prompt);
      setCalling(true);
      setIsOfflineMode(false);
      setHistory([{ sender: 'saathi', text: data.prompt }]);
      speak(data.prompt, lang);
    } catch (err) {
      // Offline fallback: Use built-in vernacular offline IVR state machine
      setIsOfflineMode(true);
      setCallId(`OFFLINE-IVR-${Date.now().toString().slice(-6)}`);
      setStage('welcome');
      setLanguage('hi');
      const welcomePrompt = OFFLINE_PROMPTS.welcome.hi;
      setPromptText(welcomePrompt);
      setCalling(true);
      setHistory([{ sender: 'saathi', text: welcomePrompt, offline: true }]);
      speak(welcomePrompt, 'hi');
    } finally {
      setLoading(false);
    }
  };

  // Process Keypad Digit Input
  const sendDigit = async (digit) => {
    if (!calling || loading) return;
    playDTMFTone(digit);
    setHistory((prev) => [...prev, { sender: 'user', digit }]);

    if (isOfflineMode) {
      // Local Offline State Machine
      handleOfflineDigit(digit);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/ivr/simulator', {
        callId,
        digits: String(digit),
        caller: '7355217358',
      }, { timeout: 3500 });
      const data = res.data.response;
      setStage(data.stage);
      setPromptText(data.prompt);
      const lang = data.language || language;
      setLanguage(lang);
      setHistory((prev) => [...prev, { sender: 'saathi', text: data.prompt }]);
      speak(data.prompt, lang);
    } catch (err) {
      // Fall back to offline state machine on network drop
      setIsOfflineMode(true);
      handleOfflineDigit(digit);
    } finally {
      setLoading(false);
    }
  };

  // Offline Engine State Machine
  const handleOfflineDigit = (digit) => {
    let nextStage = stage;
    let nextLang = language;
    let reply = '';

    if (stage === 'welcome') {
      if (digit === '1') nextLang = 'hi';
      else if (digit === '2') nextLang = 'mr';
      else if (digit === '3') nextLang = 'en';
      nextStage = 'main';
      reply = OFFLINE_PROMPTS.main[nextLang];
    } else if (stage === 'main') {
      if (digit === '1') {
        nextStage = 'prices';
        reply = OFFLINE_PROMPTS.prices[nextLang];
      } else if (digit === '2') {
        nextStage = 'sell';
        reply = OFFLINE_PROMPTS.sell[nextLang];
      } else if (digit === '3') {
        nextStage = 'recyclers';
        reply = OFFLINE_PROMPTS.recyclers[nextLang];
      } else if (digit === '4') {
        nextStage = 'payment';
        reply = OFFLINE_PROMPTS.payment[nextLang];
      } else if (digit === '5') {
        nextStage = 'safety';
        reply = OFFLINE_PROMPTS.safety[nextLang];
      } else if (digit === '9') {
        nextStage = 'welcome';
        reply = OFFLINE_PROMPTS.welcome[nextLang];
      } else {
        reply = OFFLINE_PROMPTS.main[nextLang];
      }
    } else if (stage === 'sell') {
      nextStage = 'sell_confirmed';
      reply = OFFLINE_PROMPTS.sell_confirmed[nextLang];
    } else {
      // Default return to main on '*' or any key
      nextStage = 'main';
      reply = OFFLINE_PROMPTS.main[nextLang];
    }

    setStage(nextStage);
    setLanguage(nextLang);
    setPromptText(reply);
    setHistory((prev) => [...prev, { sender: 'saathi', text: reply, offline: true }]);
    speak(reply, nextLang);
  };

  const endCall = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setCalling(false);
    setStage('welcome');
    setCallId(null);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Toggle Button (Always visible on bottom-right of every page) */}
      {!open && (
        <Tooltip title="Open Offline Toll-Free IVR (1800-522-2326)" placement="left">
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1400,
            }}
          >
            <Button
              variant="contained"
              onClick={() => {
                setOpen(true);
                if (!calling) startCall();
              }}
              startIcon={<PhoneInTalkIcon sx={{ fontSize: 20, color: '#38BDF8' }} />}
              sx={{
                bgcolor: '#111726',
                color: '#FFFFFF',
                borderRadius: 2,
                px: 2.2,
                py: 1.1,
                fontWeight: 700,
                fontSize: '0.95rem',
                border: '1px solid #1E293B',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45)',
                '&:hover': {
                  bgcolor: '#162032',
                  borderColor: '#2563EB',
                },
              }}
            >
              Voice Support (1800-522-2326)
            </Button>
          </Box>
        </Tooltip>
      )}

      {/* Expanded Interactive IVR Widget Window */}
      {open && (
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            maxHeight: '85vh',
            borderRadius: 2,
            zIndex: 1400,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#0D131F',
            color: '#FFFFFF',
            border: '1px solid #1E293B',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header Bar */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#111726',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: calling ? '#1D4ED8' : '#162032',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #1E293B',
                }}
              >
                <PhoneInTalkIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.2, color: '#FFFFFF', fontSize: '1.02rem' }}>
                  Telematics Voice Terminal
                </Typography>
                <Typography variant="body2" sx={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 600 }}>
                  Toll-Free 1800-522-2326
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => setAudioEnabled(!audioEnabled)}
                sx={{ color: audioEnabled ? '#38BDF8' : '#94A3B8' }}
              >
                {audioEnabled ? <VolumeUpIcon sx={{ fontSize: 20 }} /> : <VolumeOffIcon sx={{ fontSize: 20 }} />}
              </IconButton>
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
                <MinimizeIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Status & Mode Badge */}
          <Box sx={{ px: 2, py: 1.0, bgcolor: '#090D14', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: calling ? '#10B981' : '#64748B',
                }}
              />
              <Typography variant="body2" sx={{ color: calling ? '#10B981' : '#CBD5E1', fontWeight: 700, fontSize: '0.85rem' }}>
                {calling ? `IN CALL (${formatTimer(callDuration)})` : 'READY / OFF HOOK'}
              </Typography>
            </Stack>

            <Chip
              icon={isOfflineMode ? <WifiOffIcon sx={{ fontSize: '13px !important', color: '#F59E0B !important' }} /> : <CellTowerIcon sx={{ fontSize: '13px !important', color: '#38BDF8 !important' }} />}
              label={isOfflineMode ? 'Offline Voice Engine' : 'CPCB Cloud Voice'}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.78rem',
                fontWeight: 700,
                bgcolor: isOfflineMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                color: isOfflineMode ? '#FBBF24' : '#38BDF8',
                border: isOfflineMode ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
              }}
            />
          </Box>

          {/* Prompt Display Screen */}
          <Box
            sx={{
              p: 2,
              m: 1.5,
              borderRadius: 1.5,
              bgcolor: '#111726',
              border: '1px solid #1E293B',
              minHeight: 90,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          >
            {calling ? (
              <>
                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.8 }}>
                  <GraphicEqIcon sx={{ fontSize: 16, color: '#38BDF8' }} />
                  <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.8rem' }}>
                    Voice Operator ({language.toUpperCase()}):
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ color: '#FFFFFF', lineHeight: 1.5, fontSize: '0.95rem', fontWeight: 500 }}>
                  {promptText}
                </Typography>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body2" color="#CBD5E1" sx={{ fontSize: '0.9rem' }}>
                  Press "Start Voice Call" to test automated IVR flow offline or online.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Keypad Grid (1-9, *, 0, #) */}
          <Box sx={{ p: 1.5, pt: 0 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              {[
                { digit: '1', sub: 'Rates' },
                { digit: '2', sub: 'Sell' },
                { digit: '3', sub: 'Recycler' },
                { digit: '4', sub: 'Payment' },
                { digit: '5', sub: 'Safety' },
                { digit: '6', sub: 'MNO' },
                { digit: '7', sub: 'PQRS' },
                { digit: '8', sub: 'TUV' },
                { digit: '9', sub: 'Lang' },
                { digit: '*', sub: 'Main' },
                { digit: '0', sub: 'Agent' },
                { digit: '#', sub: 'Enter' },
              ].map((k) => (
                <Button
                  key={k.digit}
                  onClick={() => sendDigit(k.digit)}
                  disabled={!calling || loading}
                  sx={{
                    py: 1.0,
                    bgcolor: '#111726',
                    border: '1px solid #1E293B',
                    borderRadius: 1.5,
                    color: '#FFFFFF',
                    flexDirection: 'column',
                    '&:hover': {
                      bgcolor: '#162032',
                      borderColor: '#3B82F6',
                    },
                    '&:active': {
                      bgcolor: '#1D4ED8',
                    },
                  }}
                >
                  <Typography variant="h5" fontWeight="800" sx={{ lineHeight: 1, color: '#FFFFFF', fontSize: '1.25rem' }}>
                    {k.digit}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#CBD5E1', textTransform: 'uppercase', mt: 0.3, fontWeight: 600 }}>
                    {k.sub}
                  </Typography>
                </Button>
              ))}
            </Box>
          </Box>

          {/* Call Control Footer */}
          <Box sx={{ p: 2, bgcolor: '#090D14', borderTop: '1px solid #1E293B' }}>
            {!calling ? (
              <Button
                variant="contained"
                fullWidth
                onClick={startCall}
                disabled={loading}
                startIcon={<PhoneInTalkIcon sx={{ fontSize: 20 }} />}
                sx={{
                  py: 1.3,
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: '1px solid #1D4ED8',
                  '&:hover': {
                    bgcolor: '#1D4ED8',
                  },
                }}
              >
                {loading ? 'Connecting...' : 'Start Voice Call'}
              </Button>
            ) : (
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => speak(promptText, language)}
                  startIcon={<VolumeUpIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    flex: 1,
                    borderColor: '#1E293B',
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    py: 1.2,
                    '&:hover': {
                      borderColor: '#38BDF8',
                      bgcolor: 'rgba(56, 189, 248, 0.08)',
                    },
                  }}
                >
                  Replay
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={endCall}
                  startIcon={<CallEndIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    flex: 1,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    py: 1.2,
                  }}
                >
                  End Call
                </Button>
              </Stack>
            )}
          </Box>
        </Paper>
      )}
    </>
  );
}
