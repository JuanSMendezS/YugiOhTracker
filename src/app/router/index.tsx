import { Box, Button, Stack, Typography } from '@mui/material'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import AppShellLayout from '../layout/AppShellLayout'
import SessionProvider from '../providers/SessionProvider'
import AppThemeProvider from '../providers/ThemeProvider'
import { RequireAuth, RequireStore } from './RouteGuards'
import CatalogPage from '../../features/catalog/pages/CatalogPage'
import CardDetailPage from '../../features/card-detail/pages/CardDetailPage'
import CollectionPage from '../../features/collection/pages/CollectionPage'
import DashboardPage from '../../features/dashboard/pages/DashboardPage'
import DeckBuilderPage from '../../features/deck-builder/pages/DeckBuilderPage'
import LegacyWorkspacePage from '../../features/legacy/pages/LegacyWorkspacePage'
import MarketplacePage from '../../features/marketplace/pages/MarketplacePage'
import PricesPage from '../../features/prices/pages/PricesPage'
import ProfilePage from '../../features/profile/pages/ProfilePage'
import StoreLandingPage from '../../features/store/pages/StoreLandingPage'
import StoreProfilePage from '../../features/store/pages/StoreProfilePage'

function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Pagina no encontrada
      </Typography>
      <Typography color="text.secondary">La ruta solicitada no existe en este workspace.</Typography>
      <Button href="/dashboard" variant="contained">
        Ir al dashboard
      </Button>
    </Stack>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShellLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'catalog/:cardId', element: <CardDetailPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      {
        path: 'collection',
        element: (
          <RequireAuth>
            <CollectionPage />
          </RequireAuth>
        ),
      },
      {
        path: 'deck-builder',
        element: (
          <RequireAuth>
            <DeckBuilderPage />
          </RequireAuth>
        ),
      },
      { path: 'prices', element: <PricesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'store/tu-tienda',
        element: (
          <RequireStore>
            <StoreProfilePage />
          </RequireStore>
        ),
      },
      { path: 'store/:storeId', element: <StoreProfilePage /> },
      { path: 'store/:storeId/landing', element: <StoreLandingPage /> },
      { path: 'legacy', element: <LegacyWorkspacePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function AppRouter() {
  return (
    <AppThemeProvider>
      <SessionProvider>
        <Box sx={{ minHeight: '100svh' }}>
          <RouterProvider router={router} />
        </Box>
      </SessionProvider>
    </AppThemeProvider>
  )
}

export default AppRouter
