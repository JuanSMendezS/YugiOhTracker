export type TabKey = 'catalogo' | 'perfil' | 'marketplace' | 'coleccion' | 'decks'

export type ApiCard = {
  id: string
  name: string
  type?: string | null
  frameType?: string | null
  desc?: string | null
  atk?: number | null
  def?: number | null
  level?: number | null
  attribute?: string | null
  race?: string | null
  archetype?: string | null
  card_sets?: Array<{
    set_name: string
    set_code: string
    set_rarity?: string
    set_price?: string
  }>
  card_images?: Array<{
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

export type ApiSet = {
  id: string
  code: string
  name: string
}

export type ApiListing = {
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

export type ApiProfile = {
  id: string
  type: 'duelista' | 'tienda'
  display_name: string
}

export type ApiCollectionItem = {
  id: string
  quantity: number
  condition?: string | null
  language?: string | null
  is_foil?: boolean
  notes?: string | null
  card_print_id: string
  cardPrint?: {
    id?: string
    rarity?: string | null
    print_code?: string | null
    price_cardmarket?: string | number | null
    image_url?: string | null
    card?: {
      id?: string
      name?: string | null
      type?: string | null
      attribute?: string | null
      race?: string | null
      archetype?: string | null
    }
    set?: {
      id?: string
      code?: string | null
      name?: string | null
    }
  }
}

export type ApiWishlistItem = {
  id: string
  card_id: string
  priority: 'alta' | 'media' | 'baja'
  target_price?: string | number | null
  notes?: string | null
  card?: {
    id?: string
    name?: string | null
    type?: string | null
    attribute?: string | null
    race?: string | null
    archetype?: string | null
  }
}

export type ApiUser = {
  id: string
  name: string
  email: string
}

export type Paginated<T> = {
  data: T[]
}

export type DeckDraftCard = {
  card_id: string
  quantity: number
  section: 'main' | 'extra' | 'side'
}

export type DeckSummary = {
  id: string
  name: string
  description?: string | null
}

export type DeckDetail = {
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
