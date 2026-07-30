import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ApiCard } from '../../../types/app'
import { fetchCatalogCards, fetchCatalogSets } from '../services/catalogApi'

type ViewMode = 'grid' | 'list'

function safePage(rawValue: string | null): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }
  return Math.floor(parsed)
}

function CatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const selectedSet = searchParams.get('set') ?? ''
  const page = safePage(searchParams.get('page'))
  const viewMode: ViewMode = searchParams.get('view') === 'list' ? 'list' : 'grid'

  const [draftQuery, setDraftQuery] = useState(query)
  const [cards, setCards] = useState<ApiCard[]>([])
  const [sets, setSets] = useState<string[]>([])
  const [previewCard, setPreviewCard] = useState<ApiCard | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const pageSize = 24

  function updateParams(next: Partial<Record<'q' | 'set' | 'view' | 'page', string>>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    setSearchParams(params)
  }

  useEffect(() => {
    setDraftQuery(query)
  }, [query])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (draftQuery !== query) {
        updateParams({ q: draftQuery.trim(), page: '1' })
      }
    }, 260)

    return () => window.clearTimeout(timeoutId)
  }, [draftQuery, query])

  useEffect(() => {
    let disposed = false
    setIsLoadingSets(true)
    fetchCatalogSets()
      .then((nextSets) => {
        if (!disposed) {
          setSets(nextSets)
        }
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setErrorText(error instanceof Error ? error.message : 'No se pudieron cargar los sets')
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoadingSets(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    let disposed = false
    setIsLoadingCards(true)
    setErrorText(null)

    fetchCatalogCards({
      query: query || undefined,
      setName: selectedSet || undefined,
      page,
      pageSize,
    })
      .then((payload) => {
        if (!disposed) {
          setCards(payload.cards)
          setHasNextPage(payload.hasNextPage)
        }
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setCards([])
          setHasNextPage(false)
          setErrorText(error instanceof Error ? error.message : 'No se pudieron cargar las cartas')
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoadingCards(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [page, pageSize, query, selectedSet])

  useEffect(() => {
    if (!previewCard && cards.length > 0) {
      setPreviewCard(cards[0])
      return
    }
    if (previewCard && cards.some((card) => card.id === previewCard.id)) {
      return
    }
    setPreviewCard(cards[0] ?? null)
  }, [cards, previewCard])

  const selectedSetLabel = useMemo(() => {
    if (!selectedSet) {
      return 'Todos los sets'
    }
    return selectedSet
  }, [selectedSet])

  function openDetail(cardId: string) {
    navigate(`/catalog/${cardId}`)
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', lg: '270px minmax(0,1fr) 320px' },
        alignItems: 'start',
      }}
    >
      <Card sx={{ position: { lg: 'sticky' }, top: { lg: 92 } }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Filtros
            </Typography>

            <TextField
              label="Buscar carta"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Ej: Blue-Eyes"
            />

            <Autocomplete
              options={sets}
              value={selectedSet || null}
              loading={isLoadingSets}
              onChange={(_, value) => {
                updateParams({ set: value ?? '', page: '1' })
              }}
              renderInput={(params) => <TextField {...params} label="Set" placeholder="Todos" />}
            />

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip label={selectedSetLabel} variant="outlined" />
              {query ? <Chip label={`Query: ${query}`} variant="outlined" /> : null}
            </Stack>

            <Button
              variant="outlined"
              onClick={() => {
                setDraftQuery('')
                setPreviewCard(null)
                setSearchParams(new URLSearchParams({ view: viewMode, page: '1' }))
              }}
            >
              Limpiar filtros
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Resultados de catalogo
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, value: ViewMode | null) => {
                    if (value) {
                      updateParams({ view: value })
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <GridViewRoundedIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <TableRowsRoundedIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>

                <IconButton onClick={() => updateParams({ page: String(page) })}>
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {errorText ? <Alert severity="error">{errorText}</Alert> : null}

        <Card>
          <CardContent>
            {isLoadingCards ? (
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.2,
                  gridTemplateColumns: viewMode === 'grid' ? { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } : '1fr',
                }}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={viewMode === 'grid' ? 180 : 96} />
                ))}
              </Box>
            ) : cards.length === 0 ? (
              <Stack spacing={0.7} sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Sin resultados
                </Typography>
                <Typography color="text.secondary">
                  Ajusta los filtros o limpia la busqueda para explorar mas cartas.
                </Typography>
              </Stack>
            ) : viewMode === 'grid' ? (
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    variant="outlined"
                    sx={{
                      borderColor: previewCard?.id === card.id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      transition: 'border-color 120ms ease',
                    }}
                    onMouseEnter={() => setPreviewCard(card)}
                    onClick={() => setPreviewCard(card)}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1.1}>
                        <Box
                          component="img"
                          src={card.card_images?.[0]?.image_url_small}
                          alt={card.name}
                          sx={{ width: 74, borderRadius: 1.2, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                        />
                        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                            {card.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {card.type ?? 'Sin tipo'}
                          </Typography>
                          {card.attribute ? <Chip label={card.attribute} size="small" sx={{ width: 'fit-content' }} /> : null}
                          <Button size="small" onClick={() => openDetail(card.id)} sx={{ width: 'fit-content', mt: 0.4 }}>
                            Ver detalle
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Stack spacing={1}>
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    variant="outlined"
                    sx={{
                      borderColor: previewCard?.id === card.id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setPreviewCard(card)}
                    onClick={() => setPreviewCard(card)}
                  >
                    <CardContent sx={{ py: '12px !important' }}>
                      <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                            {card.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {card.type ?? 'Sin tipo'} | {card.race ?? 'Sin raza'}
                          </Typography>
                        </Box>
                        <Button size="small" onClick={() => openDetail(card.id)}>
                          Abrir
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                disabled={page <= 1 || isLoadingCards}
                onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
              >
                Anterior
              </Button>
              <Button variant="outlined" disabled={isLoadingCards || !hasNextPage} onClick={() => updateParams({ page: String(page + 1) })}>
                Siguiente
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 92 }}>
        <CardContent>
          {previewCard ? (
            <Stack spacing={1.2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Preview rapido
              </Typography>
              <Box
                component="img"
                src={previewCard.card_images?.[0]?.image_url}
                alt={previewCard.name}
                sx={{ width: '100%', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {previewCard.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {previewCard.desc?.slice(0, 240) ?? 'Sin descripcion'}
                {previewCard.desc && previewCard.desc.length > 240 ? '...' : ''}
              </Typography>
              <Button variant="contained" onClick={() => openDetail(previewCard.id)}>
                Ir a detalle
              </Button>
            </Stack>
          ) : (
            <Typography color="text.secondary">Selecciona una carta para ver su preview.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default CatalogPage
