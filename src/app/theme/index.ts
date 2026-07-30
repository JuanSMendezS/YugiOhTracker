import { createTheme } from '@mui/material/styles'
import { colorTokens, radiusTokens } from './tokens'

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colorTokens.primary,
    },
    background: {
      default: colorTokens.bg,
      paper: colorTokens.surface1,
    },
    text: {
      primary: colorTokens.text,
      secondary: colorTokens.textMuted,
    },
    success: {
      main: colorTokens.success,
    },
    warning: {
      main: colorTokens.warning,
    },
    error: {
      main: colorTokens.danger,
    },
    divider: colorTokens.line,
  },
  shape: {
    borderRadius: radiusTokens.control,
  },
  typography: {
    fontFamily: 'Space Grotesk, Segoe UI, sans-serif',
    fontSize: 14.5,
    body1: {
      fontSize: '0.96rem',
      lineHeight: 1.55,
    },
    body2: {
      fontSize: '0.86rem',
      lineHeight: 1.45,
    },
    h4: {
      fontWeight: 800,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.4rem',
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.05rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colorTokens.bg,
          color: colorTokens.text,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colorTokens.line}`,
          borderRadius: radiusTokens.card,
          boxShadow: 'none',
          backgroundColor: colorTokens.surface1,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 14,
          '&:last-child': {
            paddingBottom: 14,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.control,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
})
