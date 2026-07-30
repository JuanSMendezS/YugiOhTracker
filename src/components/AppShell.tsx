import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { ApiProfile, ApiUser, TabKey } from '../types/app'

type AppShellProps = {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  title: string
  subtitle: string
  statusText?: string
  heroMetrics: Array<{ icon: string; label: string; value: number | string }>
  user: ApiUser | null
  profile: ApiProfile | null
  children: ReactNode
}

function AppShell({
  activeTab,
  onTabChange,
  title,
  subtitle,
  statusText,
  heroMetrics,
  user,
  profile,
  children,
}: AppShellProps) {
  const tabs: Array<{ value: TabKey; label: string; icon: string }> = [
    { value: 'catalogo', label: 'Catalogo', icon: '📚' },
    { value: 'marketplace', label: 'Marketplace', icon: '🛍️' },
    { value: 'coleccion', label: 'Colección', icon: '🗃️' },
    { value: 'decks', label: 'Deck Builder', icon: '🧠' },
  ]

  return (
    <Box component="main" sx={{ display: 'grid', gap: 2.5, width: 'min(1180px, 100% - 24px)', mx: 'auto', my: 2.5 }}>
      <Box
        sx={{
          p: { xs: 2, md: 2.4 },
          borderRadius: 3,
          backgroundColor: '#f5f7fb',
          border: '1px solid #dbe2ea',
        }}
      >
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ mb: 2.5, borderRadius: 2, backgroundColor: '#1f2937', boxShadow: 'none' }}>
          <Toolbar disableGutters sx={{ justifyContent: 'center', px: { xs: 1, md: 1.5 }, py: 0.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', gap: { xs: 1, md: 3.5 }, flexWrap: 'wrap', alignItems: 'center' }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value
                return (
                  <Button
                    key={tab.value}
                    color="inherit"
                    onClick={() => onTabChange(tab.value)}
                    sx={{
                      px: 1.25,
                      py: 0.6,
                      minWidth: 'auto',
                      fontWeight: 600,
                      textTransform: 'none',
                      color: isActive ? '#ffffff' : '#d1d5db',
                      backgroundColor: isActive ? '#374151' : 'transparent',
                      borderRadius: 999,
                      '&:hover': {
                        backgroundColor: '#374151',
                        color: '#ffffff',
                      },
                    }}
                  >
                    {`${tab.icon} ${tab.label}`}
                  </Button>
                )
              })}
              <Button
                color="inherit"
                onClick={() => onTabChange('perfil')}
                sx={{
                  px: 1.25,
                  py: 0.6,
                  minWidth: 'auto',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: activeTab === 'perfil' ? '#ffffff' : '#d1d5db',
                  backgroundColor: activeTab === 'perfil' ? '#374151' : 'transparent',
                  borderRadius: 999,
                  '&:hover': {
                    backgroundColor: '#374151',
                    color: '#ffffff',
                  },
                }}
              >
                {user?.name ? `Perfil: ${user.name}` : 'Perfil'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.24em', display: 'block', mb: 0.5 }}>
              YugiHub Tracker
            </Typography>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.75, lineHeight: 1.1 }}>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '70ch' }}>
              {subtitle}
            </Typography>
            {statusText ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.1 }}>
                {statusText}
              </Typography>
            ) : null}
          </Box>

          {heroMetrics.length > 0 ? (
            <Box sx={{ display: 'grid', gap: 0.8, minWidth: { xs: '100%', md: 240 } }}>
              {heroMetrics.slice(0, 3).map((metric) => (
                <Typography key={metric.label} variant="caption" color="text.secondary">
                  {metric.icon} {metric.label}: {metric.value}
                </Typography>
              ))}
            </Box>
          ) : null}
        </Box>

      </Box>

      <Box>{children}</Box>
      {profile && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
          Perfil activo: {profile.type}
        </Typography>
      )}
    </Box>
  )
}

export default AppShell
