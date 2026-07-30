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
