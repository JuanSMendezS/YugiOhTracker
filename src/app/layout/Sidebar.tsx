import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import StyleRoundedIcon from '@mui/icons-material/StyleRounded'
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded'
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'

type NavItem = {
  to: string
  label: string
  icon: JSX.Element
  requiresAuth?: boolean
  requiresStore?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
  { to: '/catalog', label: 'Catalogo', icon: <ViewModuleRoundedIcon fontSize="small" /> },
  { to: '/marketplace', label: 'Marketplace', icon: <StorefrontRoundedIcon fontSize="small" /> },
  { to: '/collection', label: 'Coleccion', icon: <Inventory2RoundedIcon fontSize="small" />, requiresAuth: true },
  { to: '/deck-builder', label: 'Deck Builder', icon: <StyleRoundedIcon fontSize="small" />, requiresAuth: true },
  { to: '/prices', label: 'Precios', icon: <AutoGraphRoundedIcon fontSize="small" /> },
  { to: '/profile', label: 'Perfil', icon: <PersonRoundedIcon fontSize="small" /> },
  { to: '/store/tu-tienda', label: 'Tienda', icon: <SchoolRoundedIcon fontSize="small" />, requiresAuth: true, requiresStore: true },
]

type SidebarProps = {
  onNavigate?: () => void
  isAuthenticated?: boolean
  isStore?: boolean
}

function Sidebar({ onNavigate, isAuthenticated = false, isStore = false }: SidebarProps) {
  const visibleItems = navItems.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) {
      return false
    }
    if (item.requiresStore && !isStore) {
      return false
    }
    return true
  })

  return (
    <Box sx={{ width: 252, p: 1.25 }}>
      <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'text.secondary', px: 1.2 }}>
        YUGIHUB TRACKER
      </Typography>
      <Typography variant="h6" sx={{ px: 1.2, mb: 1.5, fontWeight: 700 }}>
        Ops Workspace
      </Typography>

      <Divider sx={{ mb: 1.2 }} />

      <List disablePadding>
        {visibleItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                backgroundColor: 'rgba(78, 161, 255, 0.16)',
                border: '1px solid rgba(78, 161, 255, 0.32)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

export default Sidebar
