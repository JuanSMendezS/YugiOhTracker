import { Box, Drawer } from '@mui/material'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { ApiUser } from '../../types/app'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sessionUser, setSessionUser] = useState<ApiUser | null>(null)

  useEffect(() => {
    let disposed = false

    fetch('/api/user', { credentials: 'include' })
      .then(async (response) => {
        if (!disposed) {
          setSessionUser(response.ok ? ((await response.json()) as ApiUser) : null)
        }
      })
      .catch(() => {
        if (!disposed) {
          setSessionUser(null)
        }
      })

    return () => {
      disposed = true
    }
  }, [])

  const isAuthenticated = Boolean(sessionUser)
  const isStore = sessionUser?.profile?.type === 'tienda'

  return (
    <Box sx={{ minHeight: '100svh', display: 'flex', backgroundColor: 'background.default' }}>
      <Box sx={{ display: { xs: 'none', lg: 'block' }, borderRight: '1px solid', borderColor: 'divider' }}>
        <Sidebar isAuthenticated={isAuthenticated} isStore={isStore} />
      </Box>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} isAuthenticated={isAuthenticated} isStore={isStore} />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <Box sx={{ p: { xs: 1.25, md: 1.75, lg: 2.5 }, maxWidth: 1520, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AppShellLayout
