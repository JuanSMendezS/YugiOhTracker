import { api } from '../../../lib/api'
import type { ApiCard, DeckDetail, DeckSummary, Paginated } from '../../../types/app'

export type DeckZone = 'main' | 'extra' | 'side'

export type DeckDraftCard = {
  card_id: string
  quantity: number
  section: DeckZone
}

export type DeckBuilderCard = ApiCard

export async function fetchDeckBuilderCards(params: { q: string; page: number; perPage: number }): Promise<Paginated<ApiCard>> {
  const response = await api.get<Paginated<ApiCard>>('/cards', {
    params: {
      q: params.q || undefined,
      per_page: params.perPage,
      page: params.page,
    },
  })
  return response.data
}

export async function fetchDecks(): Promise<DeckSummary[]> {
  const response = await api.get<DeckSummary[]>('/decks')
  return response.data
}

export async function fetchDeck(deckId: string): Promise<DeckDetail> {
  const response = await api.get<DeckDetail>(`/decks/${deckId}`)
  return response.data
}

export async function createDeck(payload: { name: string; description?: string; cards: DeckDraftCard[] }) {
  const response = await api.post<DeckDetail>('/decks', {
    name: payload.name,
    description: payload.description ?? null,
    cards: payload.cards,
  })
  return response.data
}

export async function createDeckVersion(payload: { deckId: string; versionName: string; cards?: DeckDraftCard[]; copyFromVersionId?: string }) {
  const response = await api.post<DeckDetail>(`/decks/${payload.deckId}/versions`, {
    version_name: payload.versionName,
    cards: payload.cards,
    copy_from_version_id: payload.copyFromVersionId ?? null,
  })
  return response.data
}
