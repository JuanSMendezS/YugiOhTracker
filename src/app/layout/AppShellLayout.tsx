import { Box, Drawer } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ minHeight: '100svh', display: 'flex', backgroundColor: 'background.default' }}>
      <Box sx={{ display: { xs: 'none', lg: 'block' }, borderRight: '1px solid', borderColor: 'divider' }}>
        <Sidebar />
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
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <Box sx={{ p: { xs: 1.5, md: 2, lg: 2.5 }, maxWidth: 1440, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AppShellLayout
