import { useEffect, useMemo, useState } from 'react'
import { api, restoreAuthToken, setAuthToken } from './lib/api'
import './App.css'

type TabKey = 'catalogo' | 'perfil' | 'marketplace' | 'coleccion' | 'decks'

type ApiCard = {
  id: string
  name: string
  type?: string | null
  attribute?: string | null
  race?: string | null
  archetype?: string | null
}

type ApiSet = {
  id: string
  code: string
  name: string
}

type ApiListing = {
  id: string
  title?: string | null
  asset_type: string
  price: string | number
  currency: string
  quantity: number
  status: string
  card_print_id?: string | null
  cardPrint?: {
    print_code?: string | null
    card?: {
      name?: string | null
    }
  }
}

type ApiProfile = {
  id: string
  type: 'duelista' | 'tienda'
  display_name: string
}

type ApiUser = {
  id: string
  name: string
  email: string
}

type Paginated<T> = {
  data: T[]
}

type DeckDraftCard = {
  card_id: string
  quantity: number
  section: 'main' | 'extra' | 'side'
}

type DeckSummary = {
  id: string
  name: string
  description?: string | null
}

type DeckDetail = {
  id: string
  name: string
  description?: string | null
  versions: Array<{
    id: string
    version_name: string
    summary: {
      total_cards: number
      estimated_total_cost: number
    }
  }>
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
  const [statusText, setStatusText] = useState('Listo para conectar con la API')

  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<ApiUser | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(null)

  const [cards, setCards] = useState<ApiCard[]>([])
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

  useEffect(() => {
    const restored = restoreAuthToken()
    setToken(restored)
    void refreshPublicData()
    if (restored) {
      void loadMe()
      void loadPrivateData()
    }
  }, [])

  async function refreshPublicData() {
    try {
      const [cardsRes, setsRes, listingsRes] = await Promise.all([
        api.get<Paginated<ApiCard>>('/cards', { params: { per_page: 12 } }),
        api.get<Paginated<ApiSet>>('/sets', { params: { per_page: 12 } }),
        api.get<Paginated<ApiListing>>('/listings', { params: { per_page: 12 } }),
      ])
      setCards(cardsRes.data.data)
      setSets(setsRes.data.data)
      setListings(listingsRes.data.data)
    } catch (error) {
      setStatusText(`No se pudo cargar datos publicos: ${getErrorMessage(error)}`)
    }
  }

  async function loadMe() {
    try {
      const response = await api.get<ApiUser>('/user')
      setUser(response.data)
    } catch {
      setAuthToken(null)
      setToken(null)
      setUser(null)
      setProfile(null)
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
      const response = await api.post<{
        token: string
        user: ApiUser
        profile: ApiProfile
      }>('/auth/register', {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        password_confirmation: registerPassword,
        profile_type: registerType,
      })
      setAuthToken(response.data.token)
      setToken(response.data.token)
      setUser(response.data.user)
      setProfile(response.data.profile)
      setStatusText('Registro exitoso')
      await loadPrivateData()
    } catch (error) {
      setStatusText(`Registro fallido: ${getErrorMessage(error)}`)
    }
  }

  async function handleLogin() {
    try {
      const response = await api.post<{
        token: string
        user: ApiUser
        profile: ApiProfile
      }>('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      })
      setAuthToken(response.data.token)
      setToken(response.data.token)
      setUser(response.data.user)
      setProfile(response.data.profile)
      setStatusText('Login exitoso')
      await loadPrivateData()
    } catch (error) {
      setStatusText(`Login fallido: ${getErrorMessage(error)}`)
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors and clear local state anyway
    }
    setAuthToken(null)
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
      const [cardsRes, setsRes] = await Promise.all([
        api.get<Paginated<ApiCard>>('/cards', { params: { q: cardQuery, per_page: 20 } }),
        api.get<Paginated<ApiSet>>('/sets', { params: { q: setQuery, per_page: 20 } }),
      ])
      setCards(cardsRes.data.data)
      setSets(setsRes.data.data)
      setStatusText('Catalogo actualizado')
    } catch (error) {
      setStatusText(`Error al buscar en catalogo: ${getErrorMessage(error)}`)
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
    if (!isStore) {
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

  return (
    <main className="app-shell">
      <header className="hero-strip">
        <p className="eyebrow">YugiHub Tracker</p>
        <h1>Frontend operativo para Fase 7</h1>
        <p className="subtitle">
          Catalogo, perfil, marketplace, inventario, coleccion, wishlist y deck builder en una sola
          consola de trabajo.
        </p>
        <div className="status-pill">{statusText}</div>
      </header>

      <nav className="tab-grid" aria-label="Navegacion principal">
        {([
          ['catalogo', 'Catalogo'],
          ['perfil', 'Perfil'],
          ['marketplace', 'Marketplace'],
          ['coleccion', 'Coleccion'],
          ['decks', 'Deck Builder'],
        ] as Array<[TabKey, string]>).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={activeTab === key ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'catalogo' && (
        <section className="panel">
          <h2>Catalogo</h2>
          <div className="controls">
            <input
              value={cardQuery}
              onChange={(event) => setCardQuery(event.target.value)}
              placeholder="Buscar cartas..."
            />
            <input
              value={setQuery}
              onChange={(event) => setSetQuery(event.target.value)}
              placeholder="Buscar sets..."
            />
            <button type="button" onClick={() => void searchCatalog()}>
              Buscar
            </button>
            <button type="button" onClick={() => void refreshPublicData()}>
              Recargar
            </button>
          </div>
          <div className="two-columns">
            <article className="card-list">
              <h3>Cartas ({cards.length})</h3>
              {cards.map((card) => (
                <div className="row" key={card.id}>
                  <strong>{card.name}</strong>
                  <span>{card.type ?? 'Sin tipo'}</span>
                  <small>{card.archetype ?? card.race ?? 'General'}</small>
                </div>
              ))}
            </article>
            <article className="card-list">
              <h3>Sets ({sets.length})</h3>
              {sets.map((set) => (
                <div className="row" key={set.id}>
                  <strong>{set.code}</strong>
                  <span>{set.name}</span>
                </div>
              ))}
            </article>
          </div>
        </section>
      )}

      {activeTab === 'perfil' && (
        <section className="panel">
          <h2>Perfil y sesion</h2>
          <div className="two-columns">
            <article className="stack">
              <h3>Login</h3>
              <input
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="Email"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
              />
              <button type="button" onClick={() => void handleLogin()}>
                Iniciar sesion
              </button>
            </article>

            <article className="stack">
              <h3>Registro</h3>
              <input
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Nombre"
              />
              <input
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="Email"
              />
              <input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Password (min 8)"
              />
              <select
                value={registerType}
                onChange={(event) => setRegisterType(event.target.value as 'duelista' | 'tienda')}
              >
                <option value="duelista">duelista</option>
                <option value="tienda">tienda</option>
              </select>
              <button type="button" onClick={() => void handleRegister()}>
                Crear cuenta
              </button>
            </article>
          </div>

          <article className="identity-box">
            <h3>Sesion actual</h3>
            <p>
              Token: <strong>{token ? 'activo' : 'sin token'}</strong>
            </p>
            <p>
              Usuario: <strong>{user?.name ?? 'No autenticado'}</strong>
            </p>
            <p>
              Perfil: <strong>{profile?.type ?? 'N/A'}</strong>
            </p>
            <button type="button" onClick={() => void handleLogout()}>
              Cerrar sesion
            </button>
          </article>
        </section>
      )}

      {activeTab === 'marketplace' && (
        <section className="panel">
          <h2>Marketplace e inventario</h2>
          <div className="controls">
            <button type="button" onClick={() => void refreshMarketplace()}>
              Refrescar publicaciones
            </button>
            <button type="button" onClick={() => void simulateBuyFirstListing()}>
              Compra rapida (1 item)
            </button>
          </div>

          <div className="two-columns">
            <article className="card-list">
              <h3>Publicaciones publicas ({listings.length})</h3>
              {listings.map((listing) => (
                <div className="row" key={listing.id}>
                  <strong>{listing.title ?? listing.cardPrint?.card?.name ?? 'Publicacion'}</strong>
                  <span>
                    {listing.price} {listing.currency} - qty {listing.quantity}
                  </span>
                  <small>
                    {listing.status} / {listing.asset_type}
                  </small>
                </div>
              ))}
            </article>

            <article className="card-list">
              <h3>Inventario de tienda ({inventory.length})</h3>
              {inventory.map((listing) => (
                <div className="row" key={listing.id}>
                  <strong>{listing.title ?? listing.cardPrint?.card?.name ?? 'Publicacion'}</strong>
                  <span>
                    {listing.price} {listing.currency}
                  </span>
                  <small>{listing.status}</small>
                </div>
              ))}
            </article>
          </div>

          <article className="stack">
            <h3>Crear publicacion (solo tienda)</h3>
            <input
              value={listingTitle}
              onChange={(event) => setListingTitle(event.target.value)}
              placeholder="Titulo"
            />
            <select
              value={listingAssetType}
              onChange={(event) => setListingAssetType(event.target.value)}
            >
              <option value="carta_individual">carta_individual</option>
              <option value="playset">playset</option>
              <option value="base">base</option>
              <option value="producto_sellado">producto_sellado</option>
            </select>
            <input
              value={listingPrice}
              onChange={(event) => setListingPrice(event.target.value)}
              placeholder="Precio"
            />
            <input
              value={listingQuantity}
              onChange={(event) => setListingQuantity(event.target.value)}
              placeholder="Cantidad"
            />
            <select
              value={listingPrintId}
              onChange={(event) => setListingPrintId(event.target.value)}
            >
              <option value="">Sin card_print_id</option>
              {availablePrints.map((item) => (
                <option key={item.printId} value={item.printId}>
                  {item.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void createListing()}>
              Publicar
            </button>
          </article>
        </section>
      )}

      {activeTab === 'coleccion' && (
        <section className="panel">
          <h2>Coleccion y wishlist</h2>
          <div className="summary-grid">
            <div>
              <span>Total cartas</span>
              <strong>{collectionSummary?.total_cards ?? 0}</strong>
            </div>
            <div>
              <span>Items distintos</span>
              <strong>{collectionSummary?.distinct_items ?? 0}</strong>
            </div>
            <div>
              <span>Valor estimado</span>
              <strong>{collectionSummary?.estimated_value ?? 0}</strong>
            </div>
          </div>

          <div className="two-columns">
            <article className="stack">
              <h3>Agregar a coleccion</h3>
              <select
                value={collectionPrintId}
                onChange={(event) => setCollectionPrintId(event.target.value)}
              >
                <option value="">Selecciona un print</option>
                {availablePrints.map((item) => (
                  <option key={item.printId} value={item.printId}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                value={collectionQty}
                onChange={(event) => setCollectionQty(event.target.value)}
                placeholder="Cantidad"
              />
              <button type="button" onClick={() => void addCollectionItem()}>
                Agregar
              </button>
            </article>

            <article className="stack">
              <h3>Agregar a wishlist</h3>
              <select
                value={wishlistCardId}
                onChange={(event) => setWishlistCardId(event.target.value)}
              >
                <option value="">Selecciona una carta</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
              <select
                value={wishlistPriority}
                onChange={(event) => setWishlistPriority(event.target.value)}
              >
                <option value="alta">alta</option>
                <option value="media">media</option>
                <option value="baja">baja</option>
              </select>
              <button type="button" onClick={() => void addWishlistItem()}>
                Agregar
              </button>
              <div className="compact-list">
                {wishlistItems.map((item) => (
                  <p key={item.id}>
                    {item.card.name} - <strong>{item.priority}</strong>
                  </p>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === 'decks' && (
        <section className="panel">
          <h2>Deck builder y versiones</h2>
          <div className="two-columns">
            <article className="stack">
              <h3>Crear deck</h3>
              <input
                value={deckName}
                onChange={(event) => setDeckName(event.target.value)}
                placeholder="Nombre del deck"
              />
              <input
                value={deckDescription}
                onChange={(event) => setDeckDescription(event.target.value)}
                placeholder="Descripcion"
              />

              <h4>Cartas para la version</h4>
              <select
                value={draftCardId}
                onChange={(event) => setDraftCardId(event.target.value)}
              >
                <option value="">Selecciona carta</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
              <div className="controls inline">
                <input
                  value={draftCardQty}
                  onChange={(event) => setDraftCardQty(event.target.value)}
                  placeholder="Qty"
                />
                <select
                  value={draftCardSection}
                  onChange={(event) =>
                    setDraftCardSection(event.target.value as 'main' | 'extra' | 'side')
                  }
                >
                  <option value="main">main</option>
                  <option value="extra">extra</option>
                  <option value="side">side</option>
                </select>
                <button type="button" onClick={addDraftCard}>
                  Agregar carta
                </button>
              </div>

              <div className="compact-list">
                {draftCards.map((card, index) => (
                  <p key={`${card.card_id}-${index}`}>
                    {card.card_id.slice(0, 8)}... x{card.quantity} [{card.section}]
                  </p>
                ))}
              </div>

              <button type="button" onClick={() => void createDeck()}>
                Crear deck
              </button>
            </article>

            <article className="stack">
              <h3>Mis decks</h3>
              <div className="compact-list">
                {decks.map((deck) => (
                  <button
                    className="link-like"
                    type="button"
                    key={deck.id}
                    onClick={() => void loadDeck(deck.id)}
                  >
                    {deck.name}
                  </button>
                ))}
              </div>

              {selectedDeck && (
                <>
                  <h4>{selectedDeck.name}</h4>
                  <p>{selectedDeck.description ?? 'Sin descripcion'}</p>
                  <div className="compact-list">
                    {selectedDeck.versions.map((version) => (
                      <p key={version.id}>
                        {version.version_name}: {version.summary.total_cards} cartas, costo estimado{' '}
                        {version.summary.estimated_total_cost}
                      </p>
                    ))}
                  </div>

                  <input
                    value={versionName}
                    onChange={(event) => setVersionName(event.target.value)}
                    placeholder="Nombre de nueva version"
                  />
                  <select
                    value={copyFromVersionId}
                    onChange={(event) => setCopyFromVersionId(event.target.value)}
                  >
                    <option value="">No copiar version</option>
                    {selectedDeck.versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        Copiar {version.version_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void createVersion()}>
                    Crear version
                  </button>
                </>
              )}
            </article>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
