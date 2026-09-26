import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';

const COMMODITY_NAMES = {
  Copper: { hi: 'तांबा', mr: 'तांबे', en: 'Copper' },
  Aluminum: { hi: 'एल्युमिनियम', mr: 'ॲल्युमिनियम', en: 'Aluminum' },
  Zinc: { hi: 'जस्ता', mr: 'जस्त', en: 'Zinc' },
  Lead: { hi: 'सीसा', mr: 'शीसे', en: 'Lead' },
  Nickel: { hi: 'निकल', mr: 'निकेल', en: 'Nickel' },
  Brass: { hi: 'पीतल', mr: 'पितळ', en: 'Brass' },
  Tin: { hi: 'टिन / रांगा', mr: 'टिन', en: 'Tin' },
};

export default function MCXTickerBar() {
  const [ticker, setTicker] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const fetchTicker = async () => {
    try {
      const res = await api.get('/prices/mcx-ticker');
      if (res.data?.success && Array.isArray(res.data.ticker)) {
        setTicker(res.data.ticker);
      }
    } catch (err) {
      console.warn('Failed to load MCX ticker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && ticker.length === 0) return null;

  const barTitle = lang === 'hi' ? 'MCX लाइव धातु दर' : lang === 'mr' ? 'MCX थेट धातू दर' : 'MCX SPOT COMMODITIES';
  const clickHint = lang === 'hi' ? 'मार्जिन कैलकुलेटर खोलें ↗' : lang === 'mr' ? 'नफा कॅल्क्युलेटर उघडा ↗' : 'Click to open Margin Optimizer ↗';

  return (
    <Box
      onClick={() => navigate('/margin-optimizer')}
      sx={{
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        py: 0.65,
        px: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        '&::-webkit-scrollbar': { height: 3 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 },
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: '#F8FAFC' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2.5, flexShrink: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#16A34A',
            boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)',
          }}
        />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.8, color: '#1D4ED8', fontSize: '0.82rem' }}>
          {barTitle}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
        {ticker.map((item) => {
          const isUp = item.change_pct >= 0;
          const localizedName = COMMODITY_NAMES[item.name]?.[lang] || item.name;
          return (
            <Box
              key={item.symbol}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.2,
                py: 0.45,
                borderRadius: 1.5,
                bgcolor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                fontSize: '0.88rem',
              }}
            >
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.88rem' }}>
                {localizedName}:
              </Typography>
              <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.92rem' }}>
                ₹{item.price_inr.toLocaleString('en-IN')}/{item.unit}
              </Typography>
              <Chip
                icon={isUp ? <TrendingUpIcon sx={{ fontSize: '13px !important', color: '#16A34A !important' }} /> : <TrendingDownIcon sx={{ fontSize: '13px !important', color: '#DC2626 !important' }} />}
                label={`${isUp ? '+' : ''}${item.change_pct}%`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  bgcolor: isUp ? '#DCFCE7' : '#FEE2E2',
                  color: isUp ? '#15803D' : '#B91C1C',
                  border: `1px solid ${isUp ? '#86EFAC' : '#FCA5A5'}`,
                  '& .MuiChip-label': { px: 0.7 },
                }}
              />
            </Box>
          );
        })}
      </Stack>

      <Typography variant="caption" sx={{ ml: 3, color: '#64748B', fontWeight: 600, flexShrink: 0, fontSize: '0.8rem' }}>
        {clickHint}
      </Typography>
    </Box>
  );
}
