import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Chip, Stack, Avatar, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InboxIcon from '@mui/icons-material/Inbox';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RecyclingIcon from '@mui/icons-material/Recycling';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MCXTickerBar from '../components/MCXTickerBar';
import FloatingIVRWidget from '../components/FloatingIVRWidget';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

const drawerWidth = 265;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { recycler, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const menuSections = [
    {
      title: t('nav.operations', 'OPERATIONS & INTAKE'),
      items: [
        { text: t('nav.dashboard', 'Dashboard Overview'), icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: '/' },
        { text: t('nav.aiInspector', 'AI Scrap Inspector'), icon: <PsychologyIcon sx={{ fontSize: 20 }} />, path: '/ai-inspector', badge: 'AI' },
        { text: t('nav.tickerMargins', 'MCX Ticker & Margins'), icon: <ShowChartIcon sx={{ fontSize: 20 }} />, path: '/margin-optimizer', badge: 'LIVE' },
        { text: t('nav.incomingLots', 'Incoming Lot Requests'), icon: <InboxIcon sx={{ fontSize: 20 }} />, path: '/lots' },
        { text: t('nav.weighbridge', 'Weighbridge Handover'), icon: <HandshakeIcon sx={{ fontSize: 20 }} />, path: '/handover' },
      ],
    },
    {
      title: t('nav.compliance', 'CPCB & COMPLIANCE'),
      items: [
        { text: t('nav.eprReports', 'EPR Form-6 Reports'), icon: <AssessmentIcon sx={{ fontSize: 20 }} />, path: '/epr-reports', badge: 'CPCB' },
        { text: t('nav.rateBoard', 'Facility Rate Board'), icon: <PriceChangeIcon sx={{ fontSize: 20 }} />, path: '/rates' },
        { text: t('nav.history', 'Settlement History'), icon: <HistoryIcon sx={{ fontSize: 20 }} />, path: '/history' },
        { text: t('nav.ivrSaathi', 'IVR Voice Saathi'), icon: <PhoneInTalkIcon sx={{ fontSize: 20 }} />, path: '/ivr-simulator' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RecyclingIcon sx={{ color: '#1D4ED8', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A', fontSize: '1.08rem', letterSpacing: -0.2, lineHeight: 1.2 }}>
            {t('common.appName', 'KabadConnect')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {t('common.tagline', 'CPCB EPR Industrial Portal')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#E2E8F0', mx: 2 }} />

      {/* Navigation Groups */}
      <Box sx={{ flexGrow: 1, py: 1.5, overflowY: 'auto', px: 1.5 }}>
        {menuSections.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                display: 'block',
                color: '#64748B',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: 1.2,
              }}
            >
              {section.title}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const isSelected =
                  location.pathname === item.path ||
                  (location.pathname.startsWith(item.path) && item.path !== '/');
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 2,
                        py: 1.0,
                        px: 1.5,
                        color: isSelected ? '#1D4ED8' : '#334155',
                        bgcolor: isSelected ? '#EFF6FF !important' : 'transparent',
                        borderLeft: isSelected ? '3px solid #1D4ED8' : '3px solid transparent',
                        transition: 'all 0.12s ease',
                        '&:hover': {
                          bgcolor: isSelected ? '#EFF6FF' : '#F8FAFC',
                          color: '#1D4ED8',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isSelected ? '#1D4ED8' : '#64748B',
                          minWidth: 32,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.92rem',
                          fontWeight: isSelected ? 700 : 600,
                        }}
                      />
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            bgcolor: isSelected ? '#DBEAFE' : '#F1F5F9',
                            color: isSelected ? '#1D4ED8' : '#64748B',
                            borderRadius: 1,
                            border: `1px solid ${isSelected ? '#BFDBFE' : '#CBD5E1'}`,
                            '& .MuiChip-label': { px: 0.8 },
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Recycler Profile Footer in Sidebar */}
      <Box sx={{ p: 1.5, m: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: '#1D4ED8',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {recycler?.name ? recycler.name.slice(0, 2).toUpperCase() : 'RC'}
          </Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight="700" color="#0F172A" noWrap display="block">
              {recycler?.name || 'Recycler Facility'}
            </Typography>
            <Typography variant="caption" color="#64748B" sx={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }} noWrap display="block">
              {recycler?.cpcb_reg_no || 'CPCB-REG-2024'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          color: '#0F172A',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="800" color="#0F172A" sx={{ fontSize: '1.08rem', lineHeight: 1.2, letterSpacing: -0.2 }}>
                {t('common.terminalTitle', 'Recycler Terminal & Weighbridge Console')}
              </Typography>
              <Typography variant="caption" color="#475569" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {t('common.portalSubtitle', 'CPCB Extended Producer Responsibility Formal Intake Portal')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            {/* 3-Way Multilingual Selector (English / हिन्दी / मराठी) */}
            <ToggleButtonGroup
              value={lang}
              exclusive
              onChange={(e, val) => val && setLang(val)}
              size="small"
              sx={{
                bgcolor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: 2,
                p: '3px',
                '& .MuiToggleButton-root': {
                  color: '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  px: 1.4,
                  py: 0.35,
                  border: 'none',
                  borderRadius: 1.5,
                  transition: 'all 0.15s ease',
                  '&.Mui-selected': {
                    bgcolor: '#1D4ED8',
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: '#1E40AF' }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    color: '#0F172A',
                  }
                }
              }}
            >
              <ToggleButton value="en">EN</ToggleButton>
              <ToggleButton value="hi">हिन्दी</ToggleButton>
              <ToggleButton value="mr">मराठी</ToggleButton>
            </ToggleButtonGroup>

            <Chip
              icon={<PhoneInTalkIcon sx={{ fontSize: '16px !important', color: '#0284C7 !important' }} />}
              label={`${t('common.helpline', 'Helpline')}: 1800-522-2326`}
              size="small"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ivr'))}
              title="Launch Toll-Free Voice Console"
              sx={{
                bgcolor: '#F0F9FF',
                color: '#0369A1',
                fontWeight: 700,
                fontSize: '0.82rem',
                height: 30,
                border: '1px solid #BAE6FD',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: '#0284C7',
                  color: '#FFFFFF',
                  '& .MuiSvgIcon-root': { color: '#FFFFFF !important' },
                },
              }}
            />
            <Chip
              icon={<VerifiedUserIcon sx={{ fontSize: '16px !important', color: '#15803D !important' }} />}
              label={t('common.cpcbConnected', 'CPCB Cloud Connected')}
              size="small"
              sx={{
                bgcolor: '#F0FDF4',
                color: '#15803D',
                fontWeight: 700,
                fontSize: '0.82rem',
                height: 30,
                border: '1px solid #BBF7D0',
                display: { xs: 'none', md: 'inline-flex' },
              }}
            />
            <Chip
              label={t('common.npciActive', 'NPCI Escrow Active')}
              size="small"
              sx={{
                bgcolor: '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 700,
                fontSize: '0.82rem',
                height: 30,
                border: '1px solid #BFDBFE',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#1D4ED8',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {recycler?.name ? recycler.name.slice(0, 1).toUpperCase() : 'R'}
            </Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', bgcolor: '#0B0F17' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', bgcolor: '#0B0F17' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#0B0F17',
        }}
      >
        <Toolbar />
        <MCXTickerBar />
        <Box sx={{ p: { xs: 2, sm: 3.5 }, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Persistent Universal Floating IVR Saathi (Offline & Online) */}
      <FloatingIVRWidget />
    </Box>
  );
}
