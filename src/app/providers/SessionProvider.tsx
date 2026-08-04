import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ApiProfile, ApiUser } from '../../types/app'

type SessionPayload = {
  authenticated?: boolean
  user?: ApiUser | null
}

type SessionContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  isStore: boolean
  user: ApiUser | null
  profile: ApiProfile | null
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

async function fetchSessionState(): Promise<SessionPayload> {
  const response = await fetch('/api/session', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return { authenticated: false, user: null }
  }

  return (await response.json()) as SessionPayload
}

type SessionProviderProps = {
  children: ReactNode
}

function SessionProvider({ children }: SessionProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<ApiUser | null>(null)

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await fetchSessionState()
      setUser(payload.authenticated ? (payload.user ?? null) : null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const value = useMemo<SessionContextValue>(() => {
    const profile = user?.profile ?? null
    return {
      isLoading,
      isAuthenticated: Boolean(user),
      isStore: profile?.type === 'tienda',
      user,
      profile,
      refreshSession,
    }
  }, [isLoading, refreshSession, user])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider')
  }
  return context
}

export default SessionProvider