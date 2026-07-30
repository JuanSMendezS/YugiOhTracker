import { Alert, Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material'
import type { ApiProfile, ApiUser } from '../../types/app'

type ProfileSectionProps = {
  loginEmail: string
  loginPassword: string
  registerName: string
  registerEmail: string
  registerPassword: string
  registerType: 'duelista' | 'tienda'
  token: string | null
  user: ApiUser | null
  profile: ApiProfile | null
  onLoginEmailChange: (value: string) => void
  onLoginPasswordChange: (value: string) => void
  onRegisterNameChange: (value: string) => void
  onRegisterEmailChange: (value: string) => void
  onRegisterPasswordChange: (value: string) => void
  onRegisterTypeChange: (value: 'duelista' | 'tienda') => void
  onLogin: () => void
  onRegister: () => void
  onLogout: () => void
}

function ProfileSection({
  loginEmail,
  loginPassword,
  registerName,
  registerEmail,
  registerPassword,
  registerType,
  token,
  user,
  profile,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegisterNameChange,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onRegisterTypeChange,
  onLogin,
  onRegister,
  onLogout,
}: ProfileSectionProps) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Iniciar sesión
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField label="Email" value={loginEmail} onChange={(event) => onLoginEmailChange(event.target.value)} fullWidth />
              <TextField label="Contraseña" type="password" value={loginPassword} onChange={(event) => onLoginPasswordChange(event.target.value)} fullWidth />
              <Button variant="contained" onClick={onLogin}>Entrar</Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Crear cuenta
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField label="Nombre" value={registerName} onChange={(event) => onRegisterNameChange(event.target.value)} fullWidth />
              <TextField label="Email" value={registerEmail} onChange={(event) => onRegisterEmailChange(event.target.value)} fullWidth />
              <TextField label="Contraseña" type="password" value={registerPassword} onChange={(event) => onRegisterPasswordChange(event.target.value)} fullWidth />
              <TextField select label="Tipo de perfil" value={registerType} onChange={(event) => onRegisterTypeChange(event.target.value as 'duelista' | 'tienda')}>
                <MenuItem value="duelista">duelista</MenuItem>
                <MenuItem value="tienda">tienda</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={onRegister}>Crear cuenta</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sesión actual
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sesión: {token ? 'activa' : 'sin sesión'}
          </Alert>
          <Typography variant="body1">Usuario: {user?.name ?? 'No autenticado'}</Typography>
          <Typography variant="body1">Perfil: {profile?.type ?? 'N/A'}</Typography>
          <Button sx={{ mt: 2 }} variant="contained" color="secondary" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ProfileSection
