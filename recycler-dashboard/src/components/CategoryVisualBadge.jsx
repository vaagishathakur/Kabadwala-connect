// src/components/CategoryVisualBadge.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import CableIcon from '@mui/icons-material/Cable';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import TvIcon from '@mui/icons-material/Tv';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import RecyclingIcon from '@mui/icons-material/Recycling';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { useLanguage } from '../i18n/LanguageContext';

const ICON_MAP = {
  PCB: MemoryIcon,
  Cable: CableIcon,
  Battery: BatteryChargingFullIcon,
  CRT: TvIcon,
  LCD: DesktopWindowsIcon,
  Motor: PrecisionManufacturingIcon,
  Plastic: RecyclingIcon,
  Mixed: CategoryIcon,
  Other: Inventory2Icon,
};

export default function CategoryVisualBadge({
  category,
  size = 'medium',
  showCode = false,
  sx = {},
}) {
  const { lang, CATEGORY_DATA } = useLanguage();
  const catKey = Object.keys(CATEGORY_DATA).find(
    (k) => k.toLowerCase() === (category || '').toLowerCase()
  ) || 'Other';

  const meta = CATEGORY_DATA[catKey] || CATEGORY_DATA.Other;
  const IconComponent = ICON_MAP[catKey] || Inventory2Icon;
  const localizedLabel = meta[lang] || meta.en;

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 0.8 : 1.2,
        px: isSmall ? 1.0 : isLarge ? 1.6 : 1.2,
        py: isSmall ? 0.3 : isLarge ? 0.8 : 0.5,
        borderRadius: 2,
        bgcolor: `${meta.color}14`,
        border: `1px solid ${meta.color}35`,
        color: '#0F172A',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isSmall ? 22 : isLarge ? 32 : 26,
          height: isSmall ? 22 : isLarge ? 32 : 26,
          borderRadius: 1.5,
          bgcolor: `${meta.color}22`,
          color: meta.color,
        }}
      >
        <IconComponent sx={{ fontSize: isSmall ? 15 : isLarge ? 22 : 18 }} />
      </Box>

      <Box>
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: isSmall ? '0.82rem' : isLarge ? '1.05rem' : '0.92rem',
            lineHeight: 1.2,
            display: 'block',
            color: '#0F172A',
          }}
        >
          {localizedLabel}
        </Typography>
        {showCode && (
          <Typography
            component="span"
            sx={{
              fontSize: '0.72rem',
              color: '#475569',
              fontFamily: 'monospace',
              fontWeight: 600,
              display: 'block',
            }}
          >
            CPCB: {meta.cpcbCode} • {catKey}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
