import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { AppBar, Box, Button, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from '@mui/material'
import { useLocation } from 'react-router-dom'

const titlesByRoute: Array<{ startsWith: string; title: string; subtitle: string }> = [
  { startsWith: '/dashboard', title: 'Dashboard', subtitle: 'Resumen operativo de juego, coleccion y mercado' },
  { startsWith: '/catalog', title: 'Catalogo', subtitle: 'Busqueda oficial de cartas y exploracion por set' },
  { startsWith: '/marketplace', title: 'Marketplace', subtitle: 'Comparacion de listings y ejecucion de operaciones' },
  { startsWith: '/collection', title: 'Coleccion', subtitle: 'Inventario y valorizacion personal o de tienda' },
  { startsWith: '/deck-builder', title: 'Deck Builder', subtitle: 'Construccion y analitica de mazos' },
  { startsWith: '/prices', title: 'Seguimiento de precios', subtitle: 'Alertas y tendencias para toma de decisiones' },
  { startsWith: '/profile', title: 'Perfil', subtitle: 'Preferencias y actividad de cuenta' },
  { startsWith: '/store', title: 'Tienda', subtitle: 'Operacion comercial y presencia publica' },
  { startsWith: '/legacy', title: 'Workspace legacy', subtitle: 'Interfaz anterior activa durante la migracion' },
]

type TopbarProps = {
  onOpenSidebar: () => void
}

function Topbar({ onOpenSidebar }: TopbarProps) {
  const location = useLocation()
  const current =
    titlesByRoute.find((entry) => location.pathname.startsWith(entry.startsWith)) ??
    ({ title: 'YugiHub Tracker', subtitle: 'Plataforma operativa para duelistas y tiendas' } as const)

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(11, 15, 20, 0.78)', backdropFilter: 'blur(10px)' }}
    >
      <Toolbar sx={{ minHeight: '72px !important', gap: 1.2 }}>
        <IconButton onClick={onOpenSidebar} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}>
          <MenuRoundedIcon />
        </IconButton>

        <Box sx={{ minWidth: 260, display: { xs: 'none', md: 'block' } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
            {current.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {current.subtitle}
          </Typography>
        </Box>

        <TextField
          placeholder="Buscar cartas, decks, tiendas, listings..."
          fullWidth
          sx={{ maxWidth: 560, ml: { xs: 0, md: 1 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack direction="row" spacing={1} sx={{ ml: 'auto', display: { xs: 'none', md: 'flex' } }}>
          <Button variant="outlined">Nuevo deck</Button>
          <Button variant="contained">Publicar listing</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Topbar
