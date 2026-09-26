import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Alert,
  Divider,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  TextField,
  LinearProgress,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DiamondIcon from '@mui/icons-material/Diamond';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const SAMPLE_PRESETS = [
  { id: 'PCB', label: 'Telecom / Motherboard PCB', cpcb: 'ITEW1', rate: '₹450/kg' },
  { id: 'Battery', label: 'Lithium-Ion Battery Pack', cpcb: 'ITEW3', rate: '₹220/kg' },
  { id: 'Cable', label: 'Heavy Copper Cable', cpcb: 'ITEW1', rate: '₹380/kg' },
  { id: 'CRT', label: 'CRT Picture Glass Tube', cpcb: 'CEEW1', rate: '₹85/kg' },
  { id: 'Motor', label: 'Compressor / Motor Scrap', cpcb: 'CEEW2', rate: '₹165/kg' },
];

export default function AIScrapInspector() {
  const [selectedPreset, setSelectedPreset] = useState('PCB');
  const [analyzing, setAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [weightKg, setWeightKg] = useState('25');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const runAnalysis = async (presetKey = selectedPreset, imageBase64 = null) => {
    setAnalyzing(true);
    try {
      const payload = imageBase64 ? { image_base64: imageBase64 } : { preset: presetKey };
      // ML microservice runs directly on port 8001 via vite proxy
      const res = await axios.post('/ml/predict/vision', payload);
      setVisionResult(res.data);
    } catch (err) {
      console.error(err);
      alert('ML service call failed. Ensure ML service is running on port 8001.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis('PCB');
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result);
      runAnalysis(null, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      alert('Could not access camera: ' + e.message);
      setCameraActive(false);
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setUploadedImage(dataUrl);

    // Stop tracks
    const stream = videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    runAnalysis(null, dataUrl);
  };

  const calculatedTotal = visionResult
    ? (parseFloat(weightKg || 0) * (visionResult.estimated_rate_inr_kg || 0)).toFixed(2)
    : '0.00';

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#FFFFFF', fontSize: '1.75rem', letterSpacing: -0.4 }} gutterBottom>
          <PsychologyIcon sx={{ verticalAlign: 'middle', mr: 1.2, fontSize: 36, color: '#3B82F6' }} />
          AI Vision Scrap Classifier & Quality Inspector
        </Typography>
        <Typography variant="body1" sx={{ color: '#CBD5E1', fontSize: '1.02rem', maxWidth: 850 }}>
          Deep learning visual inspection identifying CPCB schedule codes, precious metal yields, and hazardous element handling advisories under India E-Waste Rules 2022.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Camera / Image Capture */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#111726', border: '1px solid #1E293B' }}>
            <Typography variant="h6" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.15rem' }} gutterBottom>
              Visual Ingestion
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.92rem', mb: 2 }}>
              Upload scrap lot photograph, capture live webcam frame, or select preset industrial materials.
            </Typography>

            {/* Quick Presets */}
            <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.8rem', mb: 1.2 }}>
              QUICK TEST SAMPLES:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
              {SAMPLE_PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={`${p.label} (${p.cpcb})`}
                  color={selectedPreset === p.id ? 'primary' : 'default'}
                  onClick={() => {
                    setSelectedPreset(p.id);
                    setUploadedImage(null);
                    runAnalysis(p.id);
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    height: 28,
                    bgcolor: selectedPreset === p.id ? '#2563EB' : '#162032',
                    color: '#FFFFFF',
                    border: '1px solid #1E293B',
                  }}
                />
              ))}
            </Stack>

            {/* Image Preview Box */}
            <Box
              sx={{
                width: '100%',
                height: 290,
                borderRadius: 2,
                bgcolor: '#0B0F17',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #1E293B',
                mb: 2.5,
              }}
            >
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Scrap Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: '#94A3B8' }}>
                  <CameraAltIcon sx={{ fontSize: 60, mb: 1, color: '#475569' }} />
                  <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#FFFFFF', fontSize: '1.0rem' }}>
                    Inspecting: {visionResult?.name || 'Selected Sample'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>
                    CPCB Target: {visionResult?.cpcb_code || 'ITEW1'}
                  </Typography>
                </Box>
              )}

              {/* Bounding Box Simulation Overlay */}
              {visionResult?.bounding_box && !cameraActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: `${visionResult.bounding_box.y}%`,
                    left: `${visionResult.bounding_box.x}%`,
                    width: `${visionResult.bounding_box.width}%`,
                    height: `${visionResult.bounding_box.height}%`,
                    border: `2px dashed ${visionResult.bounding_box.color || '#22C55E'}`,
                    borderRadius: 1,
                    pointerEvents: 'none',
                    bgcolor: 'rgba(34, 197, 94, 0.08)',
                  }}
                >
                  <Chip
                    label={visionResult.bounding_box.label}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -14,
                      left: 4,
                      bgcolor: visionResult.bounding_box.color || '#22C55E',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      height: 22,
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Ingestion Buttons */}
            <Stack direction="row" spacing={2}>
              {!cameraActive ? (
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={startCamera}
                  fullWidth
                  sx={{ py: 1.2, fontWeight: 700, fontSize: '0.95rem' }}
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={captureCamera}
                  fullWidth
                  sx={{ py: 1.2, fontWeight: 700, fontSize: '0.95rem' }}
                >
                  Capture Frame
                </Button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <Button
                variant="contained"
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  py: 1.2,
                  border: '1px solid #1D4ED8',
                  '&:hover': { bgcolor: '#1D4ED8' },
                }}
              >
                Upload Photo
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: AI Analysis & CPCB Valuation */}
        <Grid item xs={12} md={6}>
          {analyzing ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, bgcolor: '#111726', border: '1px solid #1E293B' }}>
              <CircularProgress size={52} sx={{ mb: 2.5, color: '#3B82F6' }} />
              <Typography variant="h6" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.15rem' }}>
                Running Neural Visual Classifier...
              </Typography>
              <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.92rem', mt: 0.5 }}>
                Analyzing material composition, resin markings & component densities
              </Typography>
            </Paper>
          ) : visionResult ? (
            <Stack spacing={2.5}>
              {/* Primary Identification Card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#111726', border: '1px solid #1E293B', borderLeft: '4px solid #2563EB' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="caption" fontWeight="700" sx={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.8rem' }}>
                      DETECTED CLASSIFICATION
                    </Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ color: '#FFFFFF', fontSize: '1.4rem', mt: 0.4 }}>
                      {visionResult.name}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 18 }} />}
                    label={visionResult.cpcb_code}
                    color="success"
                    sx={{ fontWeight: 700, fontSize: '0.92rem', height: 32, px: 0.5 }}
                  />
                </Stack>

                <Box sx={{ mt: 1, mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                    <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.88rem' }}>Model Confidence</Typography>
                    <Typography variant="body2" fontWeight="700" sx={{ color: '#10B981', fontSize: '0.92rem' }}>
                      {visionResult.confidence_percentage}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={visionResult.confidence * 100}
                    color="success"
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#1E293B' }}
                  />
                </Box>
              </Paper>

              {/* Precious Metals Card */}
              <Card elevation={0} sx={{ bgcolor: '#111726', border: '1px solid #1E293B' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <DiamondIcon sx={{ color: '#FBBF24', fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.05rem' }}>
                      Precious & Industrial Metal Yield
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.5}>
                    {Object.entries(visionResult.precious_metals || {}).map(([metal, yieldVal]) => (
                      <Grid item xs={6} sm={3} key={metal}>
                        <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#162032', border: '1px solid #1E293B', borderRadius: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>{metal}</Typography>
                          <Typography variant="body1" fontWeight="700" sx={{ color: '#FBBF24', fontSize: '0.95rem', mt: 0.3 }}>{yieldVal}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Hazardous Substance Warnings */}
              <Alert severity="warning" icon={<WarningAmberIcon sx={{ fontSize: 24 }} />} sx={{ borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#FDE68A', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.95rem', mb: 0.5 }}>
                  Hazardous Substance Protocol (CPCB Schedule II):
                </Typography>
                <Typography variant="body2" display="block" sx={{ mb: 0.5, fontSize: '0.88rem' }}>
                  <strong>Hazardous Components:</strong> {visionResult.hazardous_elements?.join(', ')}
                </Typography>
                <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', fontSize: '0.82rem', color: '#FCD34D' }}>
                  {visionResult.safety_advisory}
                </Typography>
              </Alert>

              {/* Valuation Calculator */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#111726', border: '1px solid #1E293B' }}>
                <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#FFFFFF', fontSize: '1.05rem', mb: 2 }}>
                  Dynamic Lot Valuation
                </Typography>
                <Grid container spacing={2.5} alignItems="center">
                  <Grid item xs={6}>
                    <TextField
                      label="Batch Weight (kg)"
                      type="number"
                      size="medium"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                      Estimated Market Value
                    </Typography>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#10B981', fontSize: '1.75rem', mt: 0.3 }}>
                      ₹{calculatedTotal}
                    </Typography>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  fullWidth
                  disabled={intakeLoading}
                  endIcon={intakeLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                  onClick={async () => {
                    if (!visionResult) return;
                    try {
                      setIntakeLoading(true);
                      const lotPayload = {
                        category: visionResult.category,
                        approximate_weight_kg: Number(weightKg) || 5,
                        condition: 'Good',
                        source_type: 'Industrial',
                        description: `AI Inspector Lot: ${visionResult.category} (${visionResult.cpcb_code})`,
                        location_city: 'Mumbai',
                      };
                      const res = await api.post('/lots', lotPayload).catch(() => null);
                      const createdLot = res?.data?.lot;
                      navigate('/handover', {
                        state: {
                          lot: createdLot || {
                            category: visionResult.category,
                            cpcb_code: visionResult.cpcb_code,
                            approximate_weight_kg: Number(weightKg),
                            estimated_value_inr: calculatedTotal,
                          },
                          reference: createdLot?.id?.slice(0, 8).toUpperCase() || `KC${Math.random().toString(36).slice(-6).toUpperCase()}`,
                        }
                      });
                    } finally {
                      setIntakeLoading(false);
                    }
                  }}
                  sx={{
                    mt: 2.5,
                    bgcolor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.0rem',
                    py: 1.4,
                    '&:hover': { bgcolor: '#1D4ED8' },
                  }}
                >
                  {intakeLoading ? 'Creating Certified Intake Lot...' : 'Intake Lot & Proceed to Weighbridge Verification'}
                </Button>
              </Paper>
            </Stack>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
}
