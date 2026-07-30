export type TabKey = 'catalogo' | 'perfil' | 'marketplace' | 'coleccion' | 'decks'

export type ApiCard = {
  id: string
  name: string
  type?: string | null
  frameType?: string | null
  prints_count?: number
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
  description?: string | null
  asset_type: string
  price: string | number
  currency: string
  quantity: number
  status: string
  condition?: string | null
  language?: string | null
  card_print_id?: string | null
  user?: {
    id?: string
    name?: string | null
    profile?: ApiProfile | null
  }
  cardPrint?: {
    id?: string
    print_code?: string | null
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
    rarity?: string | null
    price_cardmarket?: string | number | null
    image_url?: string | null
  }
  items?: Array<{ id?: string; quantity?: number; card_print_id?: string | null; cardPrint?: { print_code?: string | null; rarity?: string | null } }>
  images?: Array<{ id?: string; image_path?: string | null }>
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
  profile?: ApiProfile | null
}

export type Paginated<T> = {
  data: T[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  from?: number | null
  to?: number | null
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
    cards?: Array<{
      id: string
      card_id: string
      card_name?: string | null
      quantity: number
      section: 'main' | 'extra' | 'side'
      estimated_unit_price?: number
      estimated_line_total?: number
    }>
    summary: {
      total_cards: number
      estimated_total_cost: number
    }
  }>
}
