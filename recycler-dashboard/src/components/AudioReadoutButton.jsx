// src/components/AudioReadoutButton.jsx
import React, { useState } from 'react';
import { Button, Tooltip, CircularProgress } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { useLanguage } from '../i18n/LanguageContext';

export default function AudioReadoutButton({
  text,
  label,
  size = 'small',
  variant = 'outlined',
  sx = {},
}) {
  const { speak, stopSpeaking, isSpeaking, lang, t } = useLanguage();
  const [playingSelf, setPlayingSelf] = useState(false);

  const defaultLabel = lang === 'hi' ? 'सुनें' : lang === 'mr' ? 'ऐका' : 'Listen';
  const displayLabel = label !== undefined ? label : defaultLabel;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (playingSelf && isSpeaking) {
      stopSpeaking();
      setPlayingSelf(false);
    } else {
      stopSpeaking();
      setPlayingSelf(true);
      speak(text);
      // Fallback timer in case onend is missed
      setTimeout(() => {
        setPlayingSelf(false);
      }, Math.max(3000, (text?.length || 10) * 100));
    }
  };

  const isActive = playingSelf && isSpeaking;

  return (
    <Tooltip title={isActive ? t('common.close', 'Stop audio') : (lang === 'hi' ? 'बोलकर सुनें' : lang === 'mr' ? 'बोलून ऐका' : 'Listen aloud')}>
      <Button
        size={size}
        variant={variant}
        onClick={handleToggle}
        startIcon={
          isActive ? (
            <GraphicEqIcon
              sx={{
                animation: 'pulse 1s infinite alternate',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(0.85)' },
                  '100%': { transform: 'scale(1.2)' },
                },
                color: '#1D4ED8 !important',
              }}
            />
          ) : (
            <VolumeUpIcon sx={{ fontSize: size === 'small' ? 18 : 22, color: '#1D4ED8' }} />
          )
        }
        sx={{
          fontWeight: 700,
          fontSize: size === 'small' ? '0.85rem' : '0.95rem',
          borderRadius: 2,
          py: size === 'small' ? 0.4 : 0.8,
          px: size === 'small' ? 1.4 : 2.0,
          borderColor: isActive ? '#1D4ED8' : '#CBD5E1',
          color: isActive ? '#1D4ED8' : '#0F172A',
          bgcolor: isActive ? '#EFF6FF' : '#FFFFFF',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: '#1D4ED8',
            bgcolor: '#EFF6FF',
            color: '#1D4ED8',
          },
          ...sx,
        }}
      >
        {isActive ? (lang === 'hi' ? 'बोल रहा है...' : lang === 'mr' ? 'बोलत आहे...' : 'Speaking...') : displayLabel}
      </Button>
    </Tooltip>
  );
}
