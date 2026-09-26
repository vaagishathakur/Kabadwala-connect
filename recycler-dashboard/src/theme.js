import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1D4ED8', // Vibrant Enterprise Cobalt Blue (high-contrast on white)
      light: '#3B82F6',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#475569', // Crisp Slate
      light: '#64748B',
      dark: '#334155',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#15803D', // Deep Green for readability
      light: '#22C55E',
      dark: '#166534',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#B45309', // Deep Amber
      light: '#F59E0B',
      dark: '#78350F',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#991B1B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // Crisp, gentle light slate canvas
      paper: '#FFFFFF',   // Pure clean white panels
    },
    text: {
      primary: '#0F172A',   // Deep dark slate (maximum contrast, WCAG AAA compliant)
      secondary: '#475569', // Readable slate-600 (not washed out)
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    fontSize: 15,
    h1: {
      fontSize: '2.4rem',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      color: '#0F172A',
    },
    h2: {
      fontSize: '2.0rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#0F172A',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#0F172A',
    },
    h4: {
      fontSize: '1.5rem', // ~25px - prominent metric/headline
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#0F172A',
    },
    h5: {
      fontSize: '1.25rem', // ~21px - clear card header
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#0F172A',
    },
    h6: {
      fontSize: '1.1rem', // ~18px
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#0F172A',
    },
    subtitle1: {
      fontSize: '1.05rem', // ~17px
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#1E293B',
    },
    subtitle2: {
      fontSize: '0.95rem', // ~15.5px
      fontWeight: 600,
      color: '#475569',
    },
    body1: {
      fontSize: '1.0rem', // ~16.5px - generous primary body text
      color: '#0F172A',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.925rem', // ~15px - clear secondary body text
      color: '#475569',
      lineHeight: 1.55,
    },
    caption: {
      fontSize: '0.85rem', // ~14px - legible metadata and helper text
      color: '#64748B',
      lineHeight: 1.45,
    },
    button: {
      fontSize: '0.95rem', // ~15.5px
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 22px',
          fontSize: '0.95rem',
          fontWeight: 700,
          boxShadow: 'none !important',
          transition: 'all 0.15s ease',
        },
        containedPrimary: {
          backgroundColor: '#1D4ED8',
          color: '#FFFFFF',
          border: '1px solid #1E40AF',
          '&:hover': {
            backgroundColor: '#1E40AF',
          },
        },
        containedSecondary: {
          backgroundColor: '#334155',
          color: '#FFFFFF',
          border: '1px solid #1E293B',
          '&:hover': {
            backgroundColor: '#1E293B',
          },
        },
        outlined: {
          borderColor: '#CBD5E1',
          color: '#1E293B',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderColor: '#94A3B8',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07)',
          border: '1px solid #E2E8F0',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '22px',
          '&:last-child': {
            paddingBottom: '22px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700,
          fontSize: '0.82rem',
          height: 28,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
          color: '#0F172A',
          padding: '14px 18px',
          fontSize: '0.95rem',
        },
        head: {
          backgroundColor: '#F8FAFC',
          color: '#475569',
          fontWeight: 700,
          fontSize: '0.84rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#475569',
          fontSize: '0.95rem',
          fontWeight: 600,
          '&.Mui-focused': {
            color: '#1D4ED8',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: '0.98rem',
          color: '#0F172A',
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94A3B8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1D4ED8',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
        },
      },
    },
  },
});

export default theme;
