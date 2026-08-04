import { Box, Drawer } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSession } from '../providers/SessionProvider'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, isStore } = useSession()

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
