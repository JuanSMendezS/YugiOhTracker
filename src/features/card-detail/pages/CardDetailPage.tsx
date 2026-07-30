import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ApiCard } from '../../../types/app'
import { fetchCardById } from '../../catalog/services/catalogApi'

function CardDetailPage() {
  const navigate = useNavigate()
  const { cardId } = useParams()

  const [card, setCard] = useState<ApiCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    if (!cardId) {
      setErrorText('ID de carta invalido')
      setIsLoading(false)
      return
    }

    let disposed = false
    setIsLoading(true)
    setErrorText(null)

    fetchCardById(cardId)
      .then((result) => {
        if (!disposed) {
          setCard(result)
          if (!result) {
            setErrorText('No se encontro la carta solicitada')
          }
        }
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setErrorText(error instanceof Error ? error.message : 'Error cargando detalle')
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [cardId])

  return (
    <Stack spacing={1.5}>
      <Button startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/catalog')}>
        Volver al catalogo
      </Button>

      {errorText ? <Alert severity="error">{errorText}</Alert> : null}

      {isLoading ? (
        <Stack spacing={1.2}>
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={240} />
        </Stack>
      ) : card ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,0.9fr) minmax(0,1.2fr)', xl: '340px minmax(0,1.15fr) 300px' } }}>
          <Card sx={{ minWidth: 0 }}>
            <CardContent>
              <Box
                component="img"
                src={card.card_images?.[0]?.image_url}
                alt={card.name}
                sx={{
                  width: '100%',
                  maxWidth: { xs: 260, sm: 320, lg: '100%' },
                  maxHeight: { xs: 360, sm: 420, lg: 'none' },
                  objectFit: 'contain',
                  display: 'block',
                  mx: 'auto',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 0 }}>
            <CardContent>
              <Stack spacing={1.1}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.08, fontSize: { xs: '1.7rem', sm: '2rem' } }}>
                  {card.name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.92rem', sm: '1rem' } }}>
                  {card.type ?? 'Sin tipo'} {card.race ? `| ${card.race}` : ''}
                </Typography>

                <Stack direction="row" spacing={0.8} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {card.attribute ? <Chip label={`Atributo: ${card.attribute}`} size="small" /> : null}
                  {typeof card.level === 'number' ? <Chip label={`Nivel: ${card.level}`} size="small" /> : null}
                  {typeof card.atk === 'number' ? <Chip label={`ATK ${card.atk}`} size="small" /> : null}
                  {typeof card.def === 'number' ? <Chip label={`DEF ${card.def}`} size="small" /> : null}
                </Stack>

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.92rem', sm: '0.98rem' } }}>
                  {card.desc ?? 'Sin descripcion disponible'}
                </Typography>

                <Divider />

                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Prints y sets
                </Typography>

                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 420 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Set</TableCell>
                        <TableCell>Codigo</TableCell>
                        <TableCell>Rareza</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(card.card_sets ?? []).slice(0, 12).map((entry, index) => (
                        <TableRow key={`${entry.set_name}-${entry.set_code}-${index}`}>
                          <TableCell>{entry.set_name}</TableCell>
                          <TableCell>{entry.set_code}</TableCell>
                          <TableCell>{entry.set_rarity ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 0 }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Mercado rapido
                </Typography>

                <Typography color="text.secondary">
                  Cardmarket: {card.card_prices?.[0]?.cardmarket_price ?? '-'}
                </Typography>
                <Typography color="text.secondary">eBay: {card.card_prices?.[0]?.ebay_price ?? '-'}</Typography>
                <Typography color="text.secondary">Amazon: {card.card_prices?.[0]?.amazon_price ?? '-'}</Typography>

                <Divider sx={{ my: 0.6 }} />

                <Button variant="contained">Agregar a coleccion</Button>
                <Button variant="outlined">Agregar a deck</Button>
                <Button variant="outlined">Crear alerta de precio</Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ) : null}
    </Stack>
  )
}

export default CardDetailPage
