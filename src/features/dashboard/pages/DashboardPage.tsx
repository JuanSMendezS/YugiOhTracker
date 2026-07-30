import { Card, CardContent, Grid, Stack, Typography } from '@mui/material'

const metrics = [
  { label: 'Valor coleccion', value: '$ 0.00' },
  { label: 'Variacion 24h', value: '0.0%' },
  { label: 'Decks activos', value: '0' },
  { label: 'Listings activos', value: '0' },
]

function DashboardPage() {
  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        {metrics.map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {metric.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Actividad reciente
          </Typography>
          <Typography color="text.secondary">
            Este panel conectara eventos de coleccion, marketplace y deck builder en la siguiente iteracion.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default DashboardPage
