import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ApiListing } from '../../../types/app'
import { fetchMarketplaceListings, type MarketplaceFilters } from '../services/marketplaceApi'

type ViewMode = 'table' | 'grid'

const perPageOptions = [12, 24, 48]
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'pausado', label: 'Pausado' },
]

function readPage(rawValue: string | null): number {
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) ?? 'table')
  const [items, setItems] = useState<ApiListing[]>([])
  const [selectedItems, setSelectedItems] = useState<ApiListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ current_page?: number; last_page?: number; total?: number; per_page?: number }>({})

  const filters: MarketplaceFilters = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? '',
    assetType: searchParams.get('asset_type') ?? '',
    currency: searchParams.get('currency') ?? '',
    condition: searchParams.get('condition') ?? '',
    language: searchParams.get('language') ?? '',
    sellerId: searchParams.get('seller_id') ?? '',
    cardName: searchParams.get('card_name') ?? '',
    setCode: searchParams.get('set_code') ?? '',
    priceMin: searchParams.get('price_min') ?? '',
    priceMax: searchParams.get('price_max') ?? '',
    sortBy: searchParams.get('sort_by') ?? 'updated_at',
    sortDir: searchParams.get('sort_dir') ?? 'desc',
    page: readPage(searchParams.get('page')),
    perPage: Number(searchParams.get('per_page') ?? 12),
  }

  function setParam(key: string, value: string | number | null) {
    const next = new URLSearchParams(searchParams)
    if (value === null || value === '') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
    setSearchParams(next)
  }

  async function loadListings() {
    setIsLoading(true)
    setErrorText(null)
    try {
      const response = await fetchMarketplaceListings(filters)
      setItems(response.data)
      setMeta({
        current_page: response.current_page,
        last_page: response.last_page,
        total: response.total,
        per_page: response.per_page,
      })
      setSelectedItems((current) => current.filter((item) => response.data.some((nextItem) => nextItem.id === item.id)))
    } catch (error: unknown) {
      setItems([])
      setErrorText(error instanceof Error ? error.message : 'No se pudieron cargar los listings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadListings()
  }, [searchParams.toString()])

  const currencies = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.currency).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b))
  }, [items])

  function toggleSelected(item: ApiListing) {
    setSelectedItems((current) => {
      const exists = current.some((entry) => entry.id === item.id)
      if (exists) {
        return current.filter((entry) => entry.id !== item.id)
      }
      if (current.length >= 3) {
        return [current[1], current[2]].filter(Boolean).concat(item)
      }
      return [...current, item]
    })
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '280px minmax(0,1fr) 320px' }, alignItems: 'start' }}>
      <Card sx={{ position: { xl: 'sticky' }, top: { xl: 92 } }}>
        <CardContent>
          <Stack spacing={1.3}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Filtros
            </Typography>

            <TextField label="Buscar" value={filters.q} onChange={(event) => setParam('q', event.target.value)} placeholder="Carta, título, descripción" />
            <TextField label="Nombre de carta" value={filters.cardName} onChange={(event) => setParam('card_name', event.target.value)} placeholder="Blue-Eyes" />
            <TextField label="Set code" value={filters.setCode} onChange={(event) => setParam('set_code', event.target.value)} placeholder="LOB" />

            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={filters.status} onChange={(event) => setParam('status', event.target.value)}>
                {statusOptions.map((option) => (
                  <MenuItem key={option.label} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}>
              <TextField label="Precio min" value={filters.priceMin} onChange={(event) => setParam('price_min', event.target.value)} inputMode="decimal" />
              <TextField label="Precio max" value={filters.priceMax} onChange={(event) => setParam('price_max', event.target.value)} inputMode="decimal" />
            </Box>

            <Autocomplete
              options={currencies}
              value={filters.currency || null}
              onChange={(_, value) => setParam('currency', value ?? '')}
              renderInput={(params) => <TextField {...params} label="Moneda" placeholder="COP / USD / EUR" />}
            />

            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}>
              <TextField label="Condición" value={filters.condition} onChange={(event) => setParam('condition', event.target.value)} placeholder="Near Mint" />
              <TextField label="Idioma" value={filters.language} onChange={(event) => setParam('language', event.target.value)} placeholder="EN" />
            </Box>

            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}>
              <TextField select label="Ordenar por" value={filters.sortBy} onChange={(event) => setParam('sort_by', event.target.value)}>
                <MenuItem value="updated_at">Actualizado</MenuItem>
                <MenuItem value="created_at">Creado</MenuItem>
                <MenuItem value="price">Precio</MenuItem>
              </TextField>
              <TextField select label="Dirección" value={filters.sortDir} onChange={(event) => setParam('sort_dir', event.target.value)}>
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </TextField>
            </Box>

            <TextField
              select
              label="Por pagina"
              value={String(filters.perPage)}
              onChange={(event) => setParam('per_page', event.target.value)}
            >
              {perPageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                setSearchParams({ view: viewMode, per_page: String(filters.perPage) })
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
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Listings comunitarios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {meta.total ?? 0} resultados · pagina {meta.current_page ?? 1} de {meta.last_page ?? 1}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={viewMode}
                  onChange={(_, value: ViewMode | null) => {
                    if (value) {
                      setViewMode(value)
                      setParam('view', value)
                    }
                  }}
                >
                  <ToggleButton value="table">
                    <TableRowsRoundedIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="grid">
                    <GridViewRoundedIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>

                <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadListings()}>
                  Refrescar
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {errorText ? <Alert severity="error">{errorText}</Alert> : null}

        <Card>
          <CardContent>
            {isLoading ? (
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={viewMode === 'grid' ? 190 : 92} />
                ))}
              </Box>
            ) : items.length === 0 ? (
              <Stack spacing={0.7} sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Sin listings
                </Typography>
                <Typography color="text.secondary">
                  Ajusta los filtros o limpia la busqueda para ver mas resultados.
                </Typography>
              </Stack>
            ) : viewMode === 'grid' ? (
              <Box sx={{ display: 'grid', gap: 1.2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(2, minmax(0, 1fr))' } }}>
                {items.map((item) => {
                  const isSelected = selectedItems.some((entry) => entry.id === item.id)
                  const imageUrl = item.cardPrint?.image_url ?? item.images?.[0]?.image_path ?? ''
                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      sx={{ borderColor: isSelected ? 'primary.main' : 'divider', cursor: 'pointer' }}
                      onClick={() => toggleSelected(item)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 1.2 }}>
                          <Box
                            component="img"
                            src={imageUrl}
                            alt={item.cardPrint?.card?.name ?? item.title ?? 'Listing'}
                            sx={{ width: 88, borderRadius: 1.2, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                          />
                          <Stack spacing={0.45} sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                              {item.cardPrint?.card?.name ?? item.title ?? 'Listing'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.cardPrint?.set?.name ?? item.cardPrint?.print_code ?? item.asset_type}
                            </Typography>
                            <Stack direction="row" spacing={0.7} useFlexGap sx={{ flexWrap: 'wrap' }}>
                              <Chip size="small" label={`${item.price} ${item.currency}`} />
                              <Chip size="small" label={item.status} variant="outlined" />
                              {item.condition ? <Chip size="small" label={item.condition} variant="outlined" /> : null}
                              {item.language ? <Chip size="small" label={item.language} variant="outlined" /> : null}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Vendedor: {item.user?.profile?.display_name ?? item.user?.name ?? 'Desconocido'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Cantidad: {item.quantity}
                            </Typography>
                            <Button size="small" sx={{ width: 'fit-content', mt: 0.2 }}>
                              {isSelected ? 'Quitar de comparacion' : 'Comparar'}
                            </Button>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            ) : (
              <Stack spacing={1}>
                {items.map((item) => {
                  const isSelected = selectedItems.some((entry) => entry.id === item.id)
                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      sx={{ borderColor: isSelected ? 'primary.main' : 'divider', cursor: 'pointer' }}
                      onClick={() => toggleSelected(item)}
                    >
                      <CardContent sx={{ py: '12px !important' }}>
                        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                              {item.cardPrint?.card?.name ?? item.title ?? 'Listing'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.cardPrint?.set?.name ?? item.cardPrint?.print_code ?? item.asset_type} · {item.user?.profile?.display_name ?? item.user?.name ?? 'Desconocido'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.7, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip size="small" label={`${item.price} ${item.currency}`} />
                            <Chip size="small" label={item.status} variant="outlined" />
                            <Button size="small">{isSelected ? 'Quitar' : 'Comparar'}</Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                disabled={(meta.current_page ?? 1) <= 1}
                onClick={() => setParam('page', Math.max(1, (meta.current_page ?? 1) - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outlined"
                disabled={Boolean(meta.last_page && (meta.current_page ?? 1) >= meta.last_page)}
                onClick={() => setParam('page', (meta.current_page ?? 1) + 1)}
              >
                Siguiente
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ position: { xl: 'sticky' }, top: { xl: 92 } }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <CompareArrowsRoundedIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Comparador rapido
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Selecciona hasta 3 listings para comparar precio, vendedor y estado.
            </Typography>

            {selectedItems.length === 0 ? (
              <Alert severity="info">Marca listings desde el listado para ver la comparacion aqui.</Alert>
            ) : (
              <Stack spacing={1}>
                {selectedItems.map((item) => (
                  <Card key={item.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={0.55}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {item.cardPrint?.card?.name ?? item.title ?? 'Listing'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.price} {item.currency} · {item.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.user?.profile?.display_name ?? item.user?.name ?? 'Desconocido'} · {item.quantity} unidades
                        </Typography>
                        <Button size="small" onClick={() => toggleSelected(item)} sx={{ width: 'fit-content' }}>
                          Quitar
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default MarketplacePage