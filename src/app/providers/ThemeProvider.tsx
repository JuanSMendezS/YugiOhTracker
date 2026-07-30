import { CssBaseline, ThemeProvider } from '@mui/material'
import type { ReactNode } from 'react'
import { appTheme } from '../theme'

type AppThemeProviderProps = {
  children: ReactNode
}

function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export default AppThemeProvider
