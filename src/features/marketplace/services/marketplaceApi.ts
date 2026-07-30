import { api } from '../../../lib/api'
import type { ApiListing, Paginated } from '../../../types/app'

export type MarketplaceFilters = {
  q: string
  status: string
  assetType: string
  currency: string
  condition: string
  language: string
  sellerId: string
  cardName: string
  setCode: string
  priceMin: string
  priceMax: string
  sortBy: string
  sortDir: string
  page: number
  perPage: number
}

export type MarketplaceResult = Paginated<ApiListing>

export async function fetchMarketplaceListings(filters: MarketplaceFilters): Promise<MarketplaceResult> {
  const params = new URLSearchParams()

  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.assetType) params.set('asset_type', filters.assetType)
  if (filters.currency) params.set('currency', filters.currency)
  if (filters.condition) params.set('condition', filters.condition)
  if (filters.language) params.set('language', filters.language)
  if (filters.sellerId) params.set('seller_id', filters.sellerId)
  if (filters.cardName) params.set('card_name', filters.cardName)
  if (filters.setCode) params.set('set_code', filters.setCode)
  if (filters.priceMin) params.set('price_min', filters.priceMin)
  if (filters.priceMax) params.set('price_max', filters.priceMax)
  if (filters.sortBy) params.set('sort_by', filters.sortBy)
  if (filters.sortDir) params.set('sort_dir', filters.sortDir)

  params.set('page', String(filters.page))
  params.set('per_page', String(filters.perPage))

  const response = await api.get<MarketplaceResult>('/listings', { params })
  return response.data
}
