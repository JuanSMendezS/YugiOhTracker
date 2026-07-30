import { api } from '../../../lib/api'
import type { ApiCard, ApiCollectionItem, ApiListing, ApiWishlistItem, Paginated } from '../../../types/app'

export type CollectionSummary = {
  total_cards: number
  distinct_items: number
  estimated_value: number
}

type CollectionResponse = {
  collection: {
    id: string
    items: ApiCollectionItem[]
  }
  summary: CollectionSummary
}

type WishlistResponse = {
  id: string
  items: ApiWishlistItem[]
}

export async function fetchCollectionData() {
  const [collectionRes, wishlistRes, cardsRes, listingsRes] = await Promise.all([
    api.get<CollectionResponse>('/collection/items'),
    api.get<WishlistResponse>('/wishlist/items'),
    api.get<Paginated<ApiCard>>('/cards', { params: { per_page: 120 } }),
    api.get<Paginated<ApiListing>>('/listings', { params: { per_page: 120 } }),
  ])

  const availablePrints = listingsRes.data.data
    .filter((listing) => Boolean(listing.card_print_id))
    .map((listing) => {
      const printId = listing.card_print_id as string
      const cardName = listing.cardPrint?.card?.name ?? listing.title ?? 'Carta'
      const printCode = listing.cardPrint?.print_code ?? 'sin-codigo'
      return {
        printId,
        label: `${cardName} - ${printCode}`,
      }
    })
    .filter((value, index, arr) => arr.findIndex((candidate) => candidate.printId === value.printId) === index)

  return {
    items: collectionRes.data.collection.items,
    summary: collectionRes.data.summary,
    wishlistItems: wishlistRes.data.items,
    selectableCards: cardsRes.data.data,
    availablePrints,
  }
}

export async function createCollectionItem(payload: { card_print_id: string; quantity: number }) {
  await api.post('/collection/items', payload)
}

export async function updateCollectionItem(itemId: string, payload: { quantity: number }) {
  await api.put(`/collection/items/${itemId}`, payload)
}

export async function deleteCollectionItem(itemId: string) {
  await api.delete(`/collection/items/${itemId}`)
}

export async function createWishlistItem(payload: { card_id: string; priority: 'alta' | 'media' | 'baja' }) {
  await api.post('/wishlist/items', payload)
}
