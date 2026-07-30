import { useEffect, useMemo, useState } from 'react'
import { api, ensureCsrfCookie } from './lib/api'
import AppShell from './components/AppShell'
import CatalogSection from './components/sections/CatalogSection'
import CollectionSection from './components/sections/CollectionSection'
import DecksSection from './components/sections/DecksSection'
import MarketplaceSection from './components/sections/MarketplaceSection'
import ProfileSection from './components/sections/ProfileSection'
import './App.css'
import type {
  ApiCard,
  ApiListing,
  ApiProfile,
  ApiSet,
  ApiUser,
  DeckDetail,
  DeckDraftCard,
  DeckSummary,
  Paginated,
  TabKey,
} from './types/app'

type YgoCardResponse = {
  id: number
  name: string
  type?: string
  frameType?: string
  desc?: string
  atk?: number
  def?: number
  level?: number
  attribute?: string
  race?: string
  archetype?: string
  card_sets?: Array<{
    set_name: string
    set_code: string
    set_rarity?: string
    set_price?: string
  }>
  card_images?: Array<{
    id: number
    image_url?: string
    image_url_small?: string
    image_url_cropped?: string
  }>
  card_prices?: Array<{
    cardmarket_price?: string
    ebay_price?: string
    amazon_price?: string
    coolstuffinc_price?: string
  }>
}

type YgoSetResponse = {
  set_name: string
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return maybeError.response?.data?.message ?? maybeError.message ?? 'Error inesperado'
  }
  return 'Error inesperado'
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('catalogo')
  const [statusText, setStatusText] = useState('Plataforma lista para operar')

  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<ApiUser | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(null)

  const [cards, setCards] = useState<ApiCard[]>([])
  const [allYgoSetNames, setAllYgoSetNames] = useState<string[]>([])
  const [internalCards, setInternalCards] = useState<ApiCard[]>([])
  const [sets, setSets] = useState<ApiSet[]>([])
  const [listings, setListings] = useState<ApiListing[]>([])
  const [inventory, setInventory] = useState<ApiListing[]>([])

  const [collectionSummary, setCollectionSummary] = useState<{
    total_cards: number
    distinct_items: number
    estimated_value: number
  } | null>(null)

  const [wishlistItems, setWishlistItems] = useState<
    Array<{ id: string; priority: string; card: { name: string } }>
  >([])

  const [decks, setDecks] = useState<DeckSummary[]>([])
  const [selectedDeck, setSelectedDeck] = useState<DeckDetail | null>(null)

  const [cardQuery, setCardQuery] = useState('')
  const [setQuery, setSetQuery] = useState('')
  const [selectedCardSet, setSelectedCardSet] = useState('')
  const [cardPage, setCardPage] = useState(1)
  const [cardPageSize, setCardPageSize] = useState(24)
  const [hasNextCardPage, setHasNextCardPage] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerType, setRegisterType] = useState<'duelista' | 'tienda'>('duelista')

  const [listingTitle, setListingTitle] = useState('')
  const [listingAssetType, setListingAssetType] = useState('carta_individual')
  const [listingPrice, setListingPrice] = useState('')
  const [listingQuantity, setListingQuantity] = useState('1')
  const [listingPrintId, setListingPrintId] = useState('')

  const [collectionPrintId, setCollectionPrintId] = useState('')
  const [collectionQty, setCollectionQty] = useState('1')

  const [wishlistCardId, setWishlistCardId] = useState('')
  const [wishlistPriority, setWishlistPriority] = useState('media')

  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [versionName, setVersionName] = useState('')
  const [copyFromVersionId, setCopyFromVersionId] = useState('')
  const [draftCardId, setDraftCardId] = useState('')
  const [draftCardQty, setDraftCardQty] = useState('1')
  const [draftCardSection, setDraftCardSection] = useState<'main' | 'extra' | 'side'>('main')
  const [draftCards, setDraftCards] = useState<DeckDraftCard[]>([])

  const availablePrints = useMemo(() => {
    const map = new Map<string, { printId: string; label: string }>()
    for (const listing of listings) {
      const printId = listing.card_print_id
      if (!printId || map.has(printId)) {
        continue
      }
      const name = listing.cardPrint?.card?.name ?? listing.title ?? 'Carta'
      const code = listing.cardPrint?.print_code ?? 'sin-codigo'
      map.set(printId, { printId, label: `${name} - ${code}` })
    }
    return [...map.values()]
  }, [listings])

  const isStore = profile?.type === 'tienda'
  const isAuthenticated = Boolean(token)
  const canCreateDeck = isAuthenticated
  const canCreateListing = isAuthenticated && isStore
  const canManageCollection = isAuthenticated
  const selectableCards = internalCards.length > 0 ? internalCards : cards
  const isDuelist = profile?.type === 'duelista'

  const heroMetrics = useMemo(() => {
    const metrics = [
      { icon: '🛒', label: 'Publicaciones activas', value: listings.length },
      { icon: '🗂️', label: 'Sets disponibles', value: allYgoSetNames.length },
    ]
    if (isDuelist) {
      metrics.push({ icon: '🧩', label: 'Decks cargados', value: decks.length })
    }
    return metrics
  }, [allYgoSetNames.length, decks.length, isDuelist, listings.length])

  const cardSetFilters = useMemo(() => {
    const bySet = new Map<string, { name: string; count: number }>()

    for (const setName of allYgoSetNames) {
      const normalizedName = setName.trim().toLowerCase()
      if (!normalizedName) {
        continue
      }
      if (!bySet.has(normalizedName)) {
        bySet.set(normalizedName, { name: setName.trim(), count: 0 })
      }
    }

    for (const card of cards) {
      for (const setEntry of card.card_sets ?? []) {
        const normalizedName = setEntry.set_name.trim().toLowerCase()
        if (!normalizedName) {
          continue
        }
        const current = bySet.get(normalizedName)
        if (current) {
          current.count += 1
          continue
        }
        bySet.set(normalizedName, { name: setEntry.set_name.trim(), count: 1 })
      }
    }
    return [...bySet.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allYgoSetNames, cards])

  const visibleCards = useMemo(() => {
    if (!selectedCardSet) {
      return cards
    }
    return cards.filter((card) =>
      (card.card_sets ?? []).some((setEntry) => setEntry.set_name === selectedCardSet),
    )
  }, [cards, selectedCardSet])

  useEffect(() => {
    void loadSessionAndPublicData()
  }, [])

  async function loadSessionAndPublicData() {
    void refreshPublicData()
    const isLoggedIn = await loadMe()
    if (isLoggedIn) {
      await loadPrivateData()
    }
  }

  async function loadCardsFromYgoDeck(options?: {
    query?: string
    cardSetName?: string
    page?: number
    pageSize?: number
  }) {
    const params = new URLSearchParams()
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? cardPageSize
    const offset = (page - 1) * pageSize

    if (options?.query && !params.has('name') && !params.has('fname')) {
      params.set('fname', options.query)
    }

    if (options?.cardSetName) {
      params.set('cardset', options.cardSetName)
    }

    params.set('num', String(pageSize))
    params.set('offset', String(offset))

    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`YGOPRODeck respondio ${response.status}`)
    }

    const payload = (await response.json()) as { data?: YgoCardResponse[]; error?: string }
    if (payload.error) {
      throw new Error(payload.error)
    }

    const nextCards = (payload.data ?? []).map((card) => ({
      id: String(card.id),
      name: card.name,
      type: card.type ?? null,
      frameType: card.frameType ?? null,
      desc: card.desc ?? null,
      atk: card.atk ?? null,
      def: card.def ?? null,
      level: card.level ?? null,
      attribute: card.attribute ?? null,
      race: card.race ?? null,
      archetype: card.archetype ?? null,
      card_sets: card.card_sets,
      card_images: card.card_images,
      card_prices: card.card_prices,
    }))

    setCards(nextCards)
    setHasNextCardPage(nextCards.length === pageSize)
    return nextCards.length
  }

  async function loadAllYgoSets() {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')
    if (!response.ok) {
      throw new Error(`YGOPRODeck sets respondio ${response.status}`)
    }

    const payload = (await response.json()) as YgoSetResponse[]
    const uniqueNames = Array.from(new Set(payload.map((setEntry) => setEntry.set_name.trim())))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    setAllYgoSetNames(uniqueNames)
  }

  async function refreshPublicData() {
    const failures: string[] = []

    try {
      await loadCardsFromYgoDeck({ page: 1, pageSize: cardPageSize })
      setCardPage(1)
    } catch (error) {
      failures.push(`cartas externas: ${getErrorMessage(error)}`)
    }

    try {
      await loadAllYgoSets()
    } catch (error) {
      failures.push(`sets externos: ${getErrorMessage(error)}`)
    }

    try {
      const internalCardsRes = await api.get<Paginated<ApiCard>>('/cards', { params: { per_page: 50 } })
      setInternalCards(internalCardsRes.data.data)
    } catch {
      setInternalCards([])
    }

    try {
      const [setsRes, listingsRes] = await Promise.all([
        api.get<Paginated<ApiSet>>('/sets', { params: { per_page: 12 } }),
        api.get<Paginated<ApiListing>>('/listings', { params: { per_page: 12 } }),
      ])
      setSets(setsRes.data.data)
      setListings(listingsRes.data.data)
    } catch (error) {
      failures.push(`datos del backend: ${getErrorMessage(error)}`)
    }

    if (failures.length > 0) {
      setStatusText(`Carga parcial: ${failures.join(' | ')}`)
    }
  }

  async function loadMe() {
    try {
      const response = await api.get<ApiUser>('/user')
      setUser(response.data)
      setProfile(response.data.profile ?? null)
      setToken('session')
      return true
    } catch {
      setToken(null)
      setUser(null)
      setProfile(null)
      return false
    }
  }

  async function loadPrivateData() {
    try {
      const [collectionRes, wishlistRes, decksRes] = await Promise.all([
        api.get<{
          summary: { total_cards: number; distinct_items: number; estimated_value: number }
        }>('/collection/items'),
        api.get<{ items: Array<{ id: string; priority: string; card: { name: string } }> }>(
          '/wishlist/items',
        ),
        api.get<DeckSummary[]>('/decks'),
      ])

      setCollectionSummary(collectionRes.data.summary)
      setWishlistItems(wishlistRes.data.items)
      setDecks(decksRes.data)

      if (isStore) {
        const inventoryRes = await api.get<Paginated<ApiListing>>('/inventory/store')
        setInventory(inventoryRes.data.data)
      }
    } catch (error) {
      setStatusText(`No se pudo cargar datos privados: ${getErrorMessage(error)}`)
    }
  }

  async function handleRegister() {
    try {
      await ensureCsrfCookie()
      const response = await api.post<{
        user: ApiUser
        profile: ApiProfile
      }>('/auth/register', {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        password_confirmation: registerPassword,
        profile_type: registerType,
      })
      setUser(response.data.user)
      setProfile(response.data.profile)
      setToken('session')
      setStatusText('Registro exitoso')
      await loadPrivateData()
    } catch (error) {
      setStatusText(`Registro fallido: ${getErrorMessage(error)}`)
    }
  }

  async function handleLogin() {
    try {
      await ensureCsrfCookie()
      const response = await api.post<{
        user: ApiUser
        profile: ApiProfile
      }>('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      })
      setUser(response.data.user)
      setProfile(response.data.profile)
      setToken('session')
      setStatusText('Login exitoso')
      await loadPrivateData()
    } catch (error) {
      setStatusText(`Login fallido: ${getErrorMessage(error)}`)
    }
  }

  async function handleLogout() {
    try {
      await ensureCsrfCookie()
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors and clear local state anyway
    }
    setToken(null)
    setUser(null)
    setProfile(null)
    setInventory([])
    setCollectionSummary(null)
    setWishlistItems([])
    setDecks([])
    setSelectedDeck(null)
    setStatusText('Sesion cerrada')
  }

  async function searchCatalog() {
    try {
      const targetPage = 1
      const [_, setsRes] = await Promise.all([
        loadCardsFromYgoDeck({
          query: cardQuery,
          cardSetName: selectedCardSet || undefined,
          page: targetPage,
          pageSize: cardPageSize,
        }),
        api.get<Paginated<ApiSet>>('/sets', { params: { q: setQuery, per_page: 20 } }),
      ])
      setCardPage(targetPage)
      setSets(setsRes.data.data)
    } catch (error) {
      setStatusText(`Error al buscar en catalogo: ${getErrorMessage(error)}`)
    }
  }

  async function handleSelectCardSet(setName: string) {
    setSelectedCardSet(setName)
    try {
      await loadCardsFromYgoDeck({
        query: cardQuery,
        cardSetName: setName || undefined,
        page: 1,
        pageSize: cardPageSize,
      })
      setCardPage(1)
    } catch (error) {
      setStatusText(`No se pudo filtrar por set: ${getErrorMessage(error)}`)
    }
  }

  async function goToCardPage(nextPage: number) {
    if (nextPage < 1) {
      return
    }
    try {
      await loadCardsFromYgoDeck({
        query: cardQuery,
        cardSetName: selectedCardSet || undefined,
        page: nextPage,
        pageSize: cardPageSize,
      })
      setCardPage(nextPage)
    } catch (error) {
      setStatusText(`No se pudo cambiar de pagina: ${getErrorMessage(error)}`)
    }
  }

  async function refreshMarketplace() {
    try {
      const listingsRes = await api.get<Paginated<ApiListing>>('/listings', {
        params: { per_page: 20 },
      })
      setListings(listingsRes.data.data)
      if (isStore) {
        const inventoryRes = await api.get<Paginated<ApiListing>>('/inventory/store')
        setInventory(inventoryRes.data.data)
      }
      setStatusText('Marketplace actualizado')
    } catch (error) {
      setStatusText(`No se pudo refrescar marketplace: ${getErrorMessage(error)}`)
    }
  }

  async function createListing() {
    if (!canCreateListing) {
      setStatusText('Solo los perfiles tienda pueden crear publicaciones')
      return
    }

    try {
      await api.post('/listings', {
        card_print_id: listingPrintId || null,
        asset_type: listingAssetType,
        title: listingTitle || null,
        price: Number(listingPrice),
        quantity: Number(listingQuantity),
      })
      setListingTitle('')
      setListingPrice('')
      setStatusText('Publicacion creada')
      await refreshMarketplace()
    } catch (error) {
      setStatusText(`No se pudo crear publicacion: ${getErrorMessage(error)}`)
    }
  }

  async function addCollectionItem() {
    if (!canManageCollection) {
      setStatusText('Inicia sesion para gestionar coleccion')
      return
    }
    try {
      await api.post('/collection/items', {
        card_print_id: collectionPrintId,
        quantity: Number(collectionQty),
      })
      const response = await api.get<{
        summary: { total_cards: number; distinct_items: number; estimated_value: number }
      }>('/collection/items')
      setCollectionSummary(response.data.summary)
      setStatusText('Coleccion actualizada')
    } catch (error) {
      setStatusText(`Error al actualizar coleccion: ${getErrorMessage(error)}`)
    }
  }

  async function addWishlistItem() {
    if (!canManageCollection) {
      setStatusText('Inicia sesion para gestionar wishlist')
      return
    }
    try {
      await api.post('/wishlist/items', {
        card_id: wishlistCardId,
        priority: wishlistPriority,
      })
      const response = await api.get<{
        items: Array<{ id: string; priority: string; card: { name: string } }>
      }>('/wishlist/items')
      setWishlistItems(response.data.items)
      setStatusText('Wishlist actualizada')
    } catch (error) {
      setStatusText(`Error en wishlist: ${getErrorMessage(error)}`)
    }
  }

  function addDraftCard() {
    if (!canCreateDeck) {
      setStatusText('Inicia sesion para preparar un deck')
      return
    }
    if (!draftCardId) {
      return
    }
    setDraftCards((current) => [
      ...current,
      {
        card_id: draftCardId,
        quantity: Number(draftCardQty),
        section: draftCardSection,
      },
    ])
    setDraftCardId('')
    setDraftCardQty('1')
  }

  async function createDeck() {
    if (!canCreateDeck) {
      setStatusText('Inicia sesion para crear decks')
      return
    }
    try {
      const response = await api.post<DeckDetail>('/decks', {
        name: deckName,
        description: deckDescription,
        cards: draftCards,
      })
      setDeckName('')
      setDeckDescription('')
      setDraftCards([])
      setSelectedDeck(response.data)
      const decksRes = await api.get<DeckSummary[]>('/decks')
      setDecks(decksRes.data)
      setStatusText('Deck creado')
    } catch (error) {
      setStatusText(`Error al crear deck: ${getErrorMessage(error)}`)
    }
  }

  async function loadDeck(deckId: string) {
    try {
      const response = await api.get<DeckDetail>(`/decks/${deckId}`)
      setSelectedDeck(response.data)
    } catch (error) {
      setStatusText(`No se pudo cargar el deck: ${getErrorMessage(error)}`)
    }
  }

  async function createVersion() {
    if (!canCreateDeck) {
      setStatusText('Inicia sesion para crear versiones de deck')
      return
    }
    if (!selectedDeck) {
      return
    }
    try {
      await api.post(`/decks/${selectedDeck.id}/versions`, {
        version_name: versionName,
        copy_from_version_id: copyFromVersionId || null,
        cards: draftCards,
      })
      setVersionName('')
      setCopyFromVersionId('')
      setDraftCards([])
      await loadDeck(selectedDeck.id)
      setStatusText('Version creada')
    } catch (error) {
      setStatusText(`Error al crear version: ${getErrorMessage(error)}`)
    }
  }

  async function simulateBuyFirstListing() {
    const listing = listings.find((current) => current.status === 'disponible' && current.quantity > 0)
    if (!listing) {
      setStatusText('No hay publicaciones disponibles para compra rapida')
      return
    }
    try {
      await api.post('/orders/checkout', {
        items: [{ listing_id: listing.id, quantity: 1 }],
      })
      setStatusText('Compra de prueba creada en historial')
      await refreshMarketplace()
    } catch (error) {
      setStatusText(`No se pudo reservar la compra: ${getErrorMessage(error)}`)
    }
  }

  const handlePageSizeChange = (nextSize: number) => {
    setCardPageSize(nextSize)
    void loadCardsFromYgoDeck({
      query: cardQuery,
      cardSetName: selectedCardSet || undefined,
      page: 1,
      pageSize: nextSize,
    })
    setCardPage(1)
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title="Centro operativo de cartas, tiendas y decks"
      subtitle="Todo en un solo lugar: catálogo, perfiles, marketplace, inventario, colección, wishlist, deck builder y compras."
      statusText={statusText}
      heroMetrics={heroMetrics}
      user={user}
      profile={profile}
    >
      {activeTab === 'catalogo' && (
        <CatalogSection
          cards={cards}
          visibleCards={visibleCards}
          sets={sets}
          cardSetFilters={cardSetFilters}
          cardQuery={cardQuery}
          setQuery={setQuery}
          selectedCardSet={selectedCardSet}
          cardPage={cardPage}
          cardPageSize={cardPageSize}
          hasNextCardPage={hasNextCardPage}
          onCardQueryChange={setCardQuery}
          onSetQueryChange={setSetQuery}
          onSelectCardSet={(value) => void handleSelectCardSet(value)}
          onSearch={() => void searchCatalog()}
          onPageSizeChange={handlePageSizeChange}
          onPrevPage={() => void goToCardPage(cardPage - 1)}
          onNextPage={() => void goToCardPage(cardPage + 1)}
        />
      )}

      {activeTab === 'perfil' && (
        <ProfileSection
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          registerName={registerName}
          registerEmail={registerEmail}
          registerPassword={registerPassword}
          registerType={registerType}
          token={token}
          user={user}
          profile={profile}
          onLoginEmailChange={setLoginEmail}
          onLoginPasswordChange={setLoginPassword}
          onRegisterNameChange={setRegisterName}
          onRegisterEmailChange={setRegisterEmail}
          onRegisterPasswordChange={setRegisterPassword}
          onRegisterTypeChange={setRegisterType}
          onLogin={() => void handleLogin()}
          onRegister={() => void handleRegister()}
          onLogout={() => void handleLogout()}
        />
      )}

      {activeTab === 'marketplace' && (
        <MarketplaceSection
          listings={listings}
          inventory={inventory}
          isStore={isStore}
          canCreateListing={canCreateListing}
          listingTitle={listingTitle}
          listingAssetType={listingAssetType}
          listingPrice={listingPrice}
          listingQuantity={listingQuantity}
          listingPrintId={listingPrintId}
          availablePrints={availablePrints}
          onRefresh={() => void refreshMarketplace()}
          onBuy={() => void simulateBuyFirstListing()}
          onListingTitleChange={setListingTitle}
          onListingAssetTypeChange={setListingAssetType}
          onListingPriceChange={setListingPrice}
          onListingQuantityChange={setListingQuantity}
          onListingPrintIdChange={setListingPrintId}
          onCreateListing={() => void createListing()}
        />
      )}

      {activeTab === 'coleccion' && (
        <CollectionSection
          collectionSummary={collectionSummary}
          availablePrints={availablePrints}
          selectableCards={selectableCards}
          wishlistItems={wishlistItems}
          canManageCollection={canManageCollection}
          collectionPrintId={collectionPrintId}
          collectionQty={collectionQty}
          wishlistCardId={wishlistCardId}
          wishlistPriority={wishlistPriority}
          onCollectionPrintIdChange={setCollectionPrintId}
          onCollectionQtyChange={setCollectionQty}
          onWishlistCardIdChange={setWishlistCardId}
          onWishlistPriorityChange={setWishlistPriority}
          onAddCollection={() => void addCollectionItem()}
          onAddWishlist={() => void addWishlistItem()}
        />
      )}

      {activeTab === 'decks' && (
        <DecksSection
          canCreateDeck={canCreateDeck}
          selectableCards={selectableCards}
          decks={decks}
          selectedDeck={selectedDeck}
          deckName={deckName}
          deckDescription={deckDescription}
          draftCardId={draftCardId}
          draftCardQty={draftCardQty}
          draftCardSection={draftCardSection}
          draftCards={draftCards}
          versionName={versionName}
          copyFromVersionId={copyFromVersionId}
          onDeckNameChange={setDeckName}
          onDeckDescriptionChange={setDeckDescription}
          onDraftCardIdChange={setDraftCardId}
          onDraftCardQtyChange={setDraftCardQty}
          onDraftCardSectionChange={setDraftCardSection}
          onAddDraftCard={addDraftCard}
          onCreateDeck={() => void createDeck()}
          onLoadDeck={(deckId) => void loadDeck(deckId)}
          onVersionNameChange={setVersionName}
          onCopyFromVersionIdChange={setCopyFromVersionId}
          onCreateVersion={() => void createVersion()}
        />
      )}
    </AppShell>
  )
}

export default App
