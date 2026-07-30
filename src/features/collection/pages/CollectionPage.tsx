import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
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
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type { ApiCard, ApiCollectionItem, ApiWishlistItem } from '../../../types/app'
import {
  createCollectionItem,
  createWishlistItem,
  deleteCollectionItem,
  ensureAuthToken,
  fetchCollectionData,
  type CollectionSummary,
  updateCollectionItem,
} from '../services/collectionApi'

type ViewMode = 'grid' | 'table'

type ItemStatusFilter = 'all' | 'duplicates' | 'single' | 'foil'

function CollectionPage() {
  const [summary, setSummary] = useState<CollectionSummary | null>(null)
  const [items, setItems] = useState<ApiCollectionItem[]>([])
  const [wishlistItems, setWishlistItems] = useState<ApiWishlistItem[]>([])
  const [selectableCards, setSelectableCards] = useState<ApiCard[]>([])
  const [availablePrints, setAvailablePrints] = useState<Array<{ printId: string; label: string }>>([])

  const [statusText, setStatusText] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ItemStatusFilter>('all')

  const [collectionPrintId, setCollectionPrintId] = useState('')
  const [collectionQty, setCollectionQty] = useState('1')

  const [wishlistCardId, setWishlistCardId] = useState('')
  const [wishlistPriority, setWishlistPriority] = useState<'alta' | 'media' | 'baja'>('media')

  async function loadData() {
    const token = ensureAuthToken()
    if (!token) {
      setErrorText('Inicia sesion para gestionar tu coleccion en esta vista.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorText(null)
    try {
      const payload = await fetchCollectionData()
      setItems(payload.items)
      setSummary(payload.summary)
      setWishlistItems(payload.wishlistItems)
      setSelectableCards(payload.selectableCards)
      setAvailablePrints(payload.availablePrints)
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudieron cargar los datos de coleccion')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const visibleItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      const name = item.cardPrint?.card?.name?.toLowerCase() ?? ''
      const setName = item.cardPrint?.set?.name?.toLowerCase() ?? ''
      const matchesText = !normalized || name.includes(normalized) || setName.includes(normalized)
      if (!matchesText) {
        return false
      }

      if (statusFilter === 'duplicates') {
        return item.quantity > 1
      }
      if (statusFilter === 'single') {
        return item.quantity === 1
      }
      if (statusFilter === 'foil') {
        return Boolean(item.is_foil)
      }

      return true
    })
  }, [items, searchQuery, statusFilter])

  async function handleAddCollectionItem() {
    if (!collectionPrintId) {
      setErrorText('Selecciona un print para agregar a coleccion.')
      return
    }
    const quantity = Number(collectionQty)
    if (!Number.isFinite(quantity) || quantity < 1) {
      setErrorText('La cantidad debe ser un numero mayor o igual a 1.')
      return
    }

    try {
      await createCollectionItem({
        card_print_id: collectionPrintId,
        quantity,
      })
      setCollectionPrintId('')
      setCollectionQty('1')
      setStatusText('Carta agregada a la coleccion.')
      await loadData()
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo agregar el item de coleccion')
    }
  }

  async function handleAddWishlistItem() {
    if (!wishlistCardId) {
      setErrorText('Selecciona una carta para la wishlist.')
      return
    }

    try {
      await createWishlistItem({
        card_id: wishlistCardId,
        priority: wishlistPriority,
      })
      setWishlistCardId('')
      setWishlistPriority('media')
      setStatusText('Carta agregada a la wishlist.')
      await loadData()
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo agregar item a wishlist')
    }
  }

  async function handleUpdateQuantity(itemId: string, nextQuantity: number) {
    try {
      await updateCollectionItem(itemId, { quantity: nextQuantity })
      setStatusText('Cantidad actualizada.')
      await loadData()
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo actualizar la cantidad')
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await deleteCollectionItem(itemId)
      setStatusText('Item eliminado de la coleccion.')
      await loadData()
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo eliminar el item')
    }
  }

  return (
    <Stack spacing={1.6}>
      {errorText ? <Alert severity="error">{errorText}</Alert> : null}
      {statusText ? <Alert severity="success">{statusText}</Alert> : null}

      <Box sx={{ display: 'grid', gap: 1.2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' } }}>
        {[
          { label: 'Total cartas', value: summary?.total_cards ?? 0 },
          { label: 'Items distintos', value: summary?.distinct_items ?? 0 },
          { label: 'Valor estimado', value: summary?.estimated_value?.toFixed(2) ?? '0.00' },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                {metric.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {metric.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 1.4, gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr' }, alignItems: 'start' }}>
        <Stack spacing={1.2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Inventario de coleccion
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    size="small"
                    onChange={(_, value: ViewMode | null) => {
                      if (value) {
                        setViewMode(value)
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

                  <IconButton onClick={() => void loadData()}>
                    <SyncRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gap: 1, mt: 1.3, gridTemplateColumns: { xs: '1fr', md: '1fr 220px' } }}>
                <TextField
                  label="Buscar en coleccion"
                  placeholder="Carta, set, etc"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />

                <TextField
                  select
                  label="Filtro"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as ItemStatusFilter)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="duplicates">Duplicadas</MenuItem>
                  <MenuItem value="single">Solo 1 copia</MenuItem>
                  <MenuItem value="foil">Solo foil</MenuItem>
                </TextField>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {isLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={72} />
                  ))}
                </Stack>
              ) : visibleItems.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No hay items para los filtros seleccionados.
                </Typography>
              ) : viewMode === 'table' ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Carta</TableCell>
                      <TableCell>Set</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Precio base</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleItems.map((item) => {
                      const currentQty = item.quantity
                      const price = Number(item.cardPrint?.price_cardmarket ?? 0)
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Stack spacing={0.4}>
                              <Typography sx={{ fontWeight: 600 }}>{item.cardPrint?.card?.name ?? 'Carta sin nombre'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.cardPrint?.print_code ?? '-'} {item.is_foil ? '• Foil' : ''}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{item.cardPrint?.set?.name ?? '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{price.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                              <Button size="small" variant="outlined" disabled={currentQty <= 1} onClick={() => void handleUpdateQuantity(item.id, currentQty - 1)}>
                                -1
                              </Button>
                              <Button size="small" variant="outlined" onClick={() => void handleUpdateQuantity(item.id, currentQty + 1)}>
                                +1
                              </Button>
                              <IconButton color="error" onClick={() => void handleDeleteItem(item.id)}>
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' } }}>
                  {visibleItems.map((item) => (
                    <Card key={item.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 1.1 }}>
                          <Box
                            component="img"
                            src={item.cardPrint?.image_url ?? ''}
                            alt={item.cardPrint?.card?.name ?? 'Carta'}
                            sx={{ width: 74, borderRadius: 1, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                          />
                          <Stack spacing={0.4} sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                              {item.cardPrint?.card?.name ?? 'Carta sin nombre'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.cardPrint?.set?.name ?? '-'}
                            </Typography>
                            <Chip size="small" label={`Cantidad: ${item.quantity}`} sx={{ width: 'fit-content' }} />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button size="small" variant="outlined" disabled={item.quantity <= 1} onClick={() => void handleUpdateQuantity(item.id, item.quantity - 1)}>
                                -1
                              </Button>
                              <Button size="small" variant="outlined" onClick={() => void handleUpdateQuantity(item.id, item.quantity + 1)}>
                                +1
                              </Button>
                              <IconButton color="error" onClick={() => void handleDeleteItem(item.id)}>
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={1.2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.2 }}>
                Agregar a coleccion
              </Typography>
              <Stack spacing={1}>
                <Autocomplete
                  options={availablePrints}
                  getOptionLabel={(option) => option.label}
                  value={availablePrints.find((entry) => entry.printId === collectionPrintId) ?? null}
                  onChange={(_, value) => setCollectionPrintId(value?.printId ?? '')}
                  renderInput={(params) => <TextField {...params} label="Print" placeholder="Selecciona un print" />}
                />
                <TextField
                  label="Cantidad"
                  value={collectionQty}
                  onChange={(event) => setCollectionQty(event.target.value)}
                  inputMode="numeric"
                />
                <Button variant="contained" onClick={() => void handleAddCollectionItem()}>
                  Agregar item
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.2 }}>
                Wishlist
              </Typography>
              <Stack spacing={1}>
                <Autocomplete
                  options={selectableCards}
                  getOptionLabel={(option) => option.name}
                  value={selectableCards.find((entry) => entry.id === wishlistCardId) ?? null}
                  onChange={(_, value) => setWishlistCardId(value?.id ?? '')}
                  renderInput={(params) => <TextField {...params} label="Carta" placeholder="Selecciona una carta" />}
                />

                <TextField
                  select
                  label="Prioridad"
                  value={wishlistPriority}
                  onChange={(event) => setWishlistPriority(event.target.value as 'alta' | 'media' | 'baja')}
                >
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </TextField>

                <Button variant="outlined" onClick={() => void handleAddWishlistItem()}>
                  Agregar a wishlist
                </Button>

                <Stack spacing={0.7} sx={{ mt: 0.5 }}>
                  {wishlistItems.slice(0, 8).map((item) => (
                    <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.card?.name ?? 'Carta'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prioridad: {item.priority}
                      </Typography>
                    </Box>
                  ))}
                  {wishlistItems.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No hay items en la wishlist.
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  )
}

export default CollectionPage
