import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../lib/api'
import type { ApiCard, ApiUser, DeckDetail, DeckSummary } from '../../../types/app'
import { fetchCatalogCards } from '../../catalog/services/catalogApi'
import {
  createDeck,
  createDeckVersion,
  fetchDeck,
  fetchDeckBuilderCards,
  fetchDecks,
  type DeckDraftCard,
  type DeckZone,
} from '../services/deckBuilderApi'

type BuilderItem = {
  card: ApiCard
  quantity: number
  zone: DeckZone
}

function getZoneLabel(zone: DeckZone) {
  return zone === 'main' ? 'Main Deck' : zone === 'extra' ? 'Extra Deck' : 'Side Deck'
}

function summarizeZone(cards: BuilderItem[], zone: DeckZone) {
  return cards.filter((entry) => entry.zone === zone).reduce((total, entry) => total + entry.quantity, 0)
}

function matchesSearchTerms(card: ApiCard, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true
  }

  const terms = normalizedSearch.split(/\s+/).filter(Boolean)
  if (terms.length === 0) {
    return true
  }

  const searchableText = [card.name, card.type, card.attribute, card.race, card.archetype]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()

  return terms.some((term) => searchableText.includes(term))
}

function inferDeckZone(card: ApiCard): DeckZone {
  const frameType = (card.frameType ?? '').toLowerCase()
  const cardType = (card.type ?? '').toLowerCase()

  if (['fusion', 'synchro', 'xyz', 'link'].some((value) => frameType.includes(value) || cardType.includes(value))) {
    return 'extra'
  }

  return 'main'
}

function DeckBuilderPage() {
  const navigate = useNavigate()

  const [user, setUser] = useState<ApiUser | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [cards, setCards] = useState<ApiCard[]>([])
  const [decks, setDecks] = useState<DeckSummary[]>([])
  const [selectedDeck, setSelectedDeck] = useState<DeckDetail | null>(null)
  const [draftCards, setDraftCards] = useState<BuilderItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deckSearchQuery, setDeckSearchQuery] = useState('')
  const [cardTypeFilter, setCardTypeFilter] = useState('')
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [draggedZone, setDraggedZone] = useState<DeckZone | null>(null)
  const [previewCardId, setPreviewCardId] = useState<string | null>(null)
  const [draftCardQty, setDraftCardQty] = useState('1')
  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [initialVersionName, setInitialVersionName] = useState('V1')
  const [versionName, setVersionName] = useState('V2')
  const [copyFromVersionId, setCopyFromVersionId] = useState('')
  const [statusText, setStatusText] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isLoadingDecks, setIsLoadingDecks] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  async function loadSession() {
    setIsLoadingSession(true)
    try {
      const response = await api.get<ApiUser>('/user')
      setUser(response.data)
      setSessionError(null)
    } catch {
      setUser(null)
      setSessionError('Inicia sesion para guardar decks y versiones. Puedes explorar el builder sin autenticacion.')
    } finally {
      setIsLoadingSession(false)
    }
  }

  async function loadCards() {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    setIsLoadingCards(true)
    try {
      const cardsSource = normalizedSearch
        ? (await fetchCatalogCards({ query: normalizedSearch, page: 1, pageSize: 48 })).cards
        : (await fetchDeckBuilderCards({ q: undefined, page: 1, perPage: 48 })).data

      const nextCards = cardsSource.filter((card) => {
        const matchesType = !cardTypeFilter || (card.type ?? '').toLowerCase().includes(cardTypeFilter.toLowerCase())
        return matchesType && matchesSearchTerms(card, normalizedSearch)
      })

      setCards(nextCards)
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudieron cargar las cartas del builder')
    } finally {
      setIsLoadingCards(false)
    }
  }

  async function loadDecks() {
    setIsLoadingDecks(true)
    try {
      const response = await fetchDecks()
      setDecks(response)
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudieron cargar los decks')
    } finally {
      setIsLoadingDecks(false)
    }
  }

  useEffect(() => {
    void loadSession()
    void loadCards()
    void loadDecks()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCards()
    }, 240)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery, cardTypeFilter])

  const filteredCards = useMemo(() => cards, [cards])
  const previewCard = useMemo(() => {
    if (previewCardId) {
      const exact = filteredCards.find((entry) => entry.id === previewCardId)
      if (exact) {
        return exact
      }
    }

    return filteredCards[0] ?? null
  }, [filteredCards, previewCardId])
  const visibleDecks = useMemo(() => {
    const normalized = deckSearchQuery.trim().toLowerCase()
    if (!normalized) {
      return decks
    }
    return decks.filter((deck) => deck.name.toLowerCase().includes(normalized) || (deck.description ?? '').toLowerCase().includes(normalized))
  }, [decks, deckSearchQuery])

  const mainCount = summarizeZone(draftCards, 'main')
  const extraCount = summarizeZone(draftCards, 'extra')
  const sideCount = summarizeZone(draftCards, 'side')
  const estimatedTotal = draftCards.reduce((total, entry) => {
    const unitPrice = Number(entry.card.card_prices?.[0]?.cardmarket_price ?? 0)
    return total + unitPrice * entry.quantity
  }, 0)

  function upsertDraftCard(card: ApiCard, quantity: number, zone: DeckZone) {
    setDraftCards((current) => {
      const existing = current.find((entry) => entry.card.id === card.id)
      if (existing) {
        return current.map((entry) =>
          entry.card.id === card.id
            ? { ...entry, quantity: entry.quantity + quantity, zone }
            : entry,
        )
      }
      return [...current, { card, quantity, zone }]
    })
  }

  function moveCard(cardId: string, zone: DeckZone) {
    setDraftCards((current) => current.map((entry) => (entry.card.id === cardId ? { ...entry, zone } : entry)))
  }

  function removeCard(cardId: string) {
    setDraftCards((current) => current.filter((entry) => entry.card.id !== cardId))
  }

  function addCardToDraft(card: ApiCard) {
    const quantity = Number(draftCardQty)
    if (!Number.isFinite(quantity) || quantity < 1) {
      setErrorText('Escribe una cantidad valida para agregar cartas.')
      return
    }

    upsertDraftCard(card, quantity, inferDeckZone(card))
    setPreviewCardId(card.id)
  }

  async function handleCreateDeck() {
    if (!user) {
      setErrorText('Inicia sesion para crear un deck.')
      return
    }

    if (!deckName.trim()) {
      setErrorText('Escribe un nombre para el deck.')
      return
    }

    setIsSaving(true)
    setErrorText(null)
    try {
      const payload: DeckDraftCard[] = draftCards.map((entry) => ({
        card_id: entry.card.id,
        quantity: entry.quantity,
        section: entry.zone,
      }))
      const created = await createDeck({
        name: deckName.trim(),
        description: deckDescription.trim(),
        initialVersionName: initialVersionName.trim() || 'V1',
        cards: payload,
      })
      setSelectedDeck(created)
      setStatusText('Deck creado correctamente.')
      setDeckName('')
      setDeckDescription('')
      setInitialVersionName('V1')
      await loadDecks()
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo crear el deck')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreateVersion() {
    if (!user || !selectedDeck) {
      setErrorText('Selecciona un deck y asegúrate de tener sesión iniciada.')
      return
    }

    if (!versionName.trim()) {
      setErrorText('Escribe un nombre para la versión.')
      return
    }

    setIsSaving(true)
    setErrorText(null)
    try {
      const payload: DeckDraftCard[] = draftCards.map((entry) => ({
        card_id: entry.card.id,
        quantity: entry.quantity,
        section: entry.zone,
      }))
      const created = await createDeckVersion({
        deckId: selectedDeck.id,
        versionName: versionName.trim(),
        cards: payload.length > 0 ? payload : undefined,
        copyFromVersionId: copyFromVersionId || undefined,
      })
      void created
      const refreshed = await fetchDeck(selectedDeck.id)
      setSelectedDeck(refreshed)
      setStatusText('Nueva version creada.')
      await loadDecks()
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo crear la version')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLoadDeck(deckId: string) {
    try {
      const deck = await fetchDeck(deckId)
      setSelectedDeck(deck)
      const rebuilt = deck.versions[deck.versions.length - 1]?.cards ?? []
      setDraftCards(
        rebuilt.map((entry) => ({
          card: {
            id: entry.card_id,
            name: entry.card_name ?? entry.card_id,
            card_prices: [{ cardmarket_price: String(entry.estimated_unit_price ?? 0) }],
          } as ApiCard,
          quantity: entry.quantity,
          zone: entry.section,
        })),
      )
      setStatusText(`Deck ${deck.name} cargado.`)
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'No se pudo cargar el deck')
    }
  }

  function handleDragStart(card: ApiCard, zone?: DeckZone) {
    setDraggedCardId(card.id)
    setDraggedZone(zone ?? null)
  }

  function handleDrop(zone: DeckZone) {
    if (!draggedCardId) {
      return
    }

    if (draggedZone) {
      moveCard(draggedCardId, zone)
    } else {
      const card = cards.find((entry) => entry.id === draggedCardId)
      if (card) {
        upsertDraftCard(card, 1, zone)
      }
    }

    setDraggedCardId(null)
    setDraggedZone(null)
  }

  return (
    <Stack spacing={2}>
      {isLoadingSession ? <Alert severity="info">Comprobando sesión para el Deck Builder...</Alert> : null}
      {sessionError ? <Alert severity="warning">{sessionError}</Alert> : null}
      {errorText ? <Alert severity="error">{errorText}</Alert> : null}
      {statusText ? <Alert severity="success">{statusText}</Alert> : null}

      <Box sx={{ display: 'grid', gap: 1.2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', lg: 'repeat(4, minmax(0,1fr))' } }}>
        {[
          { label: 'Main', value: mainCount },
          { label: 'Extra', value: extraCount },
          { label: 'Side', value: sideCount },
          { label: 'Costo estimado', value: estimatedTotal.toFixed(2) },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.4 }}>
                {metric.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {metric.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', xl: 'minmax(0,1fr) 320px' }, alignItems: 'start' }}>
        <Stack spacing={1.5}>
          <Card>
            <CardContent>
              <Stack spacing={1.2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Buscar cartas
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 220px' }, alignItems: 'start' }}>
                  <Stack spacing={1.2}>
                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.4fr) minmax(180px,0.8fr) 120px' } }}>
                      <TextField label="Buscar" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Nombre, arquetipo..." />
                      <TextField
                        select
                        label="Tipo"
                        value={cardTypeFilter}
                        onChange={(event) => setCardTypeFilter(event.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Monster">Monster</MenuItem>
                        <MenuItem value="Spell">Spell</MenuItem>
                        <MenuItem value="Trap">Trap</MenuItem>
                      </TextField>
                      <TextField label="Cantidad" value={draftCardQty} onChange={(event) => setDraftCardQty(event.target.value)} inputMode="numeric" />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Main y Extra se asignan automaticamente segun el tipo de carta. Side Deck se gestiona moviendo cartas despues de agregarlas.
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Arrastra una carta desde la lista al deck o usa el boton Agregar.
                    </Typography>

                    {isLoadingCards ? (
                      <Stack spacing={0.8}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Skeleton key={index} variant="rounded" height={78} />
                        ))}
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          maxHeight: { xs: 340, md: 420, lg: 520 },
                          overflow: 'auto',
                          pr: 0.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <Stack spacing={0.8} sx={{ p: 1 }}>
                          {filteredCards.map((card) => (
                            <Card
                              key={card.id}
                              variant="outlined"
                              draggable
                              onDragStart={() => handleDragStart(card)}
                              onMouseEnter={() => setPreviewCardId(card.id)}
                              sx={{ cursor: 'grab', minHeight: 78, display: 'flex', alignItems: 'center' }}
                            >
                              <CardContent sx={{ py: '10px !important', width: '100%' }}>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <DragIndicatorRoundedIcon fontSize="small" />
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                                      {card.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {card.type ?? 'Sin tipo'} · {card.attribute ?? 'Sin atributo'}
                                    </Typography>
                                  </Box>
                                  <Chip label={getZoneLabel(inferDeckZone(card))} size="small" variant="outlined" />
                                  <Button
                                    size="small"
                                    startIcon={<AddRoundedIcon />}
                                    onClick={() => addCardToDraft(card)}
                                  >
                                    Agregar
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>

                  <Box
                    sx={{
                      minHeight: { xs: 220, lg: 320 },
                      alignSelf: { xs: 'stretch', lg: 'center' },
                      mt: { xs: 0, lg: 3 },
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {previewCard?.card_images?.[0]?.image_url ? (
                      <Box
                        component="img"
                        src={previewCard.card_images[0].image_url}
                        alt={previewCard.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, textAlign: 'center' }}>
                        Selecciona una carta para ver la imagen.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr 160px' } }}>
                <TextField label="Nombre del deck" value={deckName} onChange={(event) => setDeckName(event.target.value)} />
                <TextField label="Descripción" value={deckDescription} onChange={(event) => setDeckDescription(event.target.value)} />
                <TextField label="Versión inicial" value={initialVersionName} onChange={(event) => setInitialVersionName(event.target.value)} />
                <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={() => void handleCreateDeck()} disabled={isSaving}>
                  Guardar deck
                </Button>
              </Box>

              <Box sx={{ display: 'grid', gap: 1.2, mt: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' } }}>
                {(['main', 'extra', 'side'] as DeckZone[]).map((zone) => {
                  const zoneCards = draftCards.filter((entry) => entry.zone === zone)
                  return (
                    <Card
                      key={zone}
                      variant="outlined"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(zone)}
                      sx={{ minHeight: 320, borderStyle: 'dashed' }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {getZoneLabel(zone)}
                          </Typography>
                          <Chip label={zoneCards.reduce((sum, entry) => sum + entry.quantity, 0)} size="small" />
                        </Box>

                        <Stack spacing={0.8}>
                          {zoneCards.length === 0 ? (
                            <Alert severity="info">Suelta cartas aqui o usa Agregar.</Alert>
                          ) : (
                            zoneCards.map((entry) => (
                              <Card
                                key={`${entry.card.id}-${zone}`}
                                variant="outlined"
                                draggable
                                onDragStart={() => handleDragStart(entry.card, zone)}
                              >
                                <CardContent sx={{ py: '10px !important' }}>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <DragIndicatorRoundedIcon fontSize="small" />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                                        {entry.card.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        x{entry.quantity}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Button size="small" onClick={() => moveCard(entry.card.id, zone)}>
                                        Mover
                                      </Button>
                                      <Button size="small" color="error" onClick={() => removeCard(entry.card.id)}>
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                      </Button>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Mis decks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Guarda, carga y versiona decks directamente desde aqui.
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadDecks()} disabled={isLoadingDecks}>
                    Refrescar
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                  <Autocomplete
                    options={visibleDecks}
                    getOptionLabel={(option) => option.name}
                    loading={isLoadingDecks}
                    onChange={(_, value) => {
                      if (value) {
                        void handleLoadDeck(value.id)
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Cargar deck" placeholder="Selecciona un deck" />}
                  />
                  <TextField label="Nombre nueva versión" value={versionName} onChange={(event) => setVersionName(event.target.value)} />
                </Box>

                <TextField label="Buscar deck" value={deckSearchQuery} onChange={(event) => setDeckSearchQuery(event.target.value)} placeholder="Nombre o descripción" />

                {selectedDeck ? (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {selectedDeck.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDeck.description ?? 'Sin descripción'}
                    </Typography>

                    <Box sx={{ display: 'grid', gap: 0.8, mt: 1 }}>
                      {selectedDeck.versions.map((version) => (
                        <Box key={version.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>{version.version_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {version.summary.total_cards} cartas · costo estimado {version.summary.estimated_total_cost}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: 'grid', gap: 1, mt: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 140px' } }}>
                      <TextField label="Copiar desde versión" value={copyFromVersionId} onChange={(event) => setCopyFromVersionId(event.target.value)} placeholder="Opcional" />
                      <Button variant="contained" onClick={() => void handleCreateVersion()} disabled={isSaving}>
                        Crear versión
                      </Button>
                    </Box>
                  </Box>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Card sx={{ position: { xl: 'sticky' }, top: { xl: 92 } }}>
          <CardContent>
            <Stack spacing={1.2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Analítica rápida
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sección central con Main / Extra / Side, drag & drop nativo y resumen del mazo.
              </Typography>

              <Alert severity="info">Main y Extra se sugieren por tipo. Side queda disponible para ajustes manuales.</Alert>

              <Typography variant="body2">
                Main: {mainCount}
                <br />
                Extra: {extraCount}
                <br />
                Side: {sideCount}
                <br />
                Costo estimado: {estimatedTotal.toFixed(2)}
              </Typography>

              <Button variant="outlined" onClick={() => navigate('/catalog')}>
                Abrir catalogo
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}

export default DeckBuilderPage