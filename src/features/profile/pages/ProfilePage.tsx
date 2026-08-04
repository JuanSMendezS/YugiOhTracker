import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Fade,
  FormControlLabel,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api, ensureCsrfCookie } from '../../../lib/api'
import { useSession } from '../../../app/providers/SessionProvider'
import type { ApiProfile, ApiUser } from '../../../types/app'

type ProfileLocationState = {
  from?: string
  denied?: 'store-required'
}

function ProfilePage() {
  const location = useLocation()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerType, setRegisterType] = useState<'duelista' | 'tienda'>('duelista')

  const [statusText, setStatusText] = useState('')
  const { user, profile, isLoading, refreshSession } = useSession()

  const locationState = (location.state ?? null) as ProfileLocationState | null
  const redirectFrom = locationState?.from
  const deniedReason = locationState?.denied

  let accessNotice: string | null = null
  if (!user && redirectFrom) {
    accessNotice = `Debes iniciar sesion para acceder a ${redirectFrom}.`
  }
  if (user && deniedReason === 'store-required') {
    accessNotice = 'Esta seccion requiere perfil de tienda. Cambia tu perfil o usa una cuenta de tienda.'
  }

  async function handleLogin() {
    try {
      await ensureCsrfCookie()
      await api.post<{ message: string; user: ApiUser; profile: ApiProfile }>('/auth/login', {
        email: loginEmail,
        password: loginPassword,
        remember: rememberMe,
      })
      await refreshSession()
      setStatusText('Sesion iniciada.')
      setLoginPassword('')
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'No se pudo iniciar sesion')
    }
  }

  async function handleRegister() {
    try {
      await ensureCsrfCookie()
      await api.post<{ message: string; user: ApiUser; profile: ApiProfile }>('/auth/register', {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        password_confirmation: registerPassword,
        profile_type: registerType,
      })
      await refreshSession()
      setStatusText('Cuenta creada y sesion iniciada.')
      setRegisterPassword('')
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'No se pudo crear la cuenta')
    }
  }

  async function handleLogout() {
    try {
      await ensureCsrfCookie()
      await api.post('/auth/logout')
    } catch {
      // limpiar estado local aunque el logout remoto falle
    } finally {
      await refreshSession()
      setStatusText('Sesion cerrada.')
    }
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Acceso y sesion
            </Typography>            
          </Stack>
        </CardContent>
      </Card>

      {statusText ? <Alert severity="info">{statusText}</Alert> : null}
      {accessNotice ? <Alert severity="warning">{accessNotice}</Alert> : null}

      {!user ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr' }, alignItems: 'start' }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5} sx={{ maxWidth: 560 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {authMode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
                  </Typography>

                  <ToggleButtonGroup
                    value={authMode}
                    exclusive
                    size="small"
                    onChange={(_, value: 'login' | 'register' | null) => {
                      if (value) {
                        setAuthMode(value)
                      }
                    }}
                  >
                    <ToggleButton value="login">Iniciar sesion</ToggleButton>
                    <ToggleButton value="register">Crear cuenta</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                <Fade in={authMode === 'login'} timeout={220} unmountOnExit>
                  <Stack spacing={1.5}>
                    <TextField label="Email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} fullWidth />
                    <TextField label="Contraseña" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} fullWidth />
                    <FormControlLabel
                      control={<Checkbox checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />}
                      label="Mantener sesion iniciada"
                    />
                    <Button variant="contained" startIcon={<LoginRoundedIcon />} onClick={() => void handleLogin()}>
                      Entrar
                    </Button>
                    <Button variant="text" onClick={() => setAuthMode('register')} sx={{ alignSelf: 'flex-start' }}>
                      ¿No tienes cuenta? Crear cuenta
                    </Button>
                  </Stack>
                </Fade>

                <Fade in={authMode === 'register'} timeout={220} unmountOnExit>
                  <Stack spacing={1.5}>
                    <TextField label="Nombre" value={registerName} onChange={(event) => setRegisterName(event.target.value)} fullWidth />
                    <TextField label="Email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} fullWidth />
                    <TextField label="Contraseña" type="password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} fullWidth />
                    <TextField select label="Tipo de perfil" value={registerType} onChange={(event) => setRegisterType(event.target.value as 'duelista' | 'tienda')}>
                      <MenuItem value="duelista">Duelista</MenuItem>
                      <MenuItem value="tienda">Tienda</MenuItem>
                    </TextField>
                    <Button variant="contained" startIcon={<PersonAddAltRoundedIcon />} onClick={() => void handleRegister()}>
                      Crear cuenta
                    </Button>
                    <Button variant="text" onClick={() => setAuthMode('login')} sx={{ alignSelf: 'flex-start' }}>
                      Ya tengo cuenta. Iniciar sesion
                    </Button>
                  </Stack>
                </Fade>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ) : null}

      <Card>
        <CardContent>
          <Stack spacing={1.2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Sesion actual
            </Typography>

            {isLoading ? (
              <Typography color="text.secondary">Comprobando sesion...</Typography>
            ) : user ? (
              <Stack spacing={0.5}>
                <Typography>Usuario: {user.name}</Typography>
                <Typography>Perfil: {profile?.type ?? 'N/A'}</Typography>
                <Typography color="text.secondary">
                  Tu sesion permanece activa mientras la pestaña y las cookies sigan disponibles.
                </Typography>
              </Stack>
            ) : (
              <Alert severity="warning" icon={<SecurityRoundedIcon />}>
                No hay sesion activa.
              </Alert>
            )}

            <Button
              sx={{ alignSelf: 'flex-start' }}
              variant="contained"
              color="secondary"
              startIcon={<LogoutRoundedIcon />}
              onClick={() => void handleLogout()}
              disabled={!user}
            >
              Cerrar sesion
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default ProfilePage
