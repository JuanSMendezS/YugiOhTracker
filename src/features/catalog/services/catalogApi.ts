import type { ApiCard } from '../../../types/app'

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

function normalizeCard(card: YgoCardResponse): ApiCard {
  return {
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
  }
}

export async function fetchCatalogCards(options: {
  query?: string
  setName?: string
  page: number
  pageSize: number
}): Promise<{ cards: ApiCard[]; hasNextPage: boolean }> {
  const params = new URLSearchParams()
  const offset = (options.page - 1) * options.pageSize

  if (options.query) {
    params.set('fname', options.query)
  }
  if (options.setName) {
    params.set('cardset', options.setName)
  }
  params.set('num', String(options.pageSize))
  params.set('offset', String(offset))

  const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`YGOPRODeck respondio ${response.status}`)
  }

  const payload = (await response.json()) as { data?: YgoCardResponse[]; error?: string }
  if (payload.error) {
    if (payload.error.toLowerCase().includes('no card matching')) {
      return { cards: [], hasNextPage: false }
    }
    throw new Error(payload.error)
  }

  const cards = (payload.data ?? []).map(normalizeCard)
  return {
    cards,
    hasNextPage: cards.length === options.pageSize,
  }
}

export async function fetchCatalogSets(): Promise<string[]> {
  const response = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')
  if (!response.ok) {
    throw new Error(`YGOPRODeck sets respondio ${response.status}`)
  }

  const payload = (await response.json()) as YgoSetResponse[]
  return payload.map((set) => set.set_name).sort((a, b) => a.localeCompare(b))
}

export async function fetchCardById(cardId: string): Promise<ApiCard | null> {
  const params = new URLSearchParams({ id: cardId })
  const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`YGOPRODeck respondio ${response.status}`)
  }

  const payload = (await response.json()) as { data?: YgoCardResponse[]; error?: string }
  if (payload.error) {
    if (payload.error.toLowerCase().includes('no card matching')) {
      return null
    }
    throw new Error(payload.error)
  }

  const card = payload.data?.[0]
  return card ? normalizeCard(card) : null
}
