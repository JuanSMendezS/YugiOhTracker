import { CircularProgress, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../providers/SessionProvider'

type GuardProps = {
  children: ReactNode
}

function GuardLoading() {
  return (
    <Stack spacing={1.2} sx={{ py: 4, alignItems: 'center' }}>
      <CircularProgress size={24} />
      <Typography color="text.secondary">Verificando sesion...</Typography>
    </Stack>
  )
}

export function RequireAuth({ children }: GuardProps) {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useSession()

  if (isLoading) {
    return <GuardLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export function RequireStore({ children }: GuardProps) {
  const location = useLocation()
  const { isLoading, isAuthenticated, isStore } = useSession()

  if (isLoading) {
    return <GuardLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />
  }

  if (!isStore) {
    return <Navigate to="/profile" replace state={{ denied: 'store-required', from: location.pathname }} />
  }

  return <>{children}</>
}