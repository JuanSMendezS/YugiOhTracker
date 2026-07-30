import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material'
import CatalogItemCard from '../CatalogItemCard'
import SetFilterSearch from '../SetFilterSearch'
import type { ApiCard, ApiSet } from '../../types/app'

type CatalogSectionProps = {
  cards: ApiCard[]
  visibleCards: ApiCard[]
  sets: ApiSet[]
  cardSetFilters: Array<{ name: string; count?: number }>
  cardQuery: string
  setQuery: string
  selectedCardSet: string
  cardPage: number
  cardPageSize: number
  hasNextCardPage: boolean
  onCardQueryChange: (value: string) => void
  onSetQueryChange: (value: string) => void
  onSelectCardSet: (value: string) => void
  onSearch: () => void
  onPageSizeChange: (value: number) => void
  onPrevPage: () => void
  onNextPage: () => void
}

function CatalogSection({
  cards,
  visibleCards,
  sets,
  cardSetFilters,
  cardQuery,
  setQuery,
  selectedCardSet,
  cardPage,
  cardPageSize,
  hasNextCardPage,
  onCardQueryChange,
  onSetQueryChange,
  onSelectCardSet,
  onSearch,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: CatalogSectionProps) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Card sx={{ overflow: 'visible', position: 'relative', zIndex: 2 }}>
        <CardContent sx={{ overflow: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, alignItems: { xs: 'stretch', md: 'center' } }}>
            <TextField label="Buscar cartas" value={cardQuery} onChange={(event) => onCardQueryChange(event.target.value)} fullWidth />
            <SetFilterSearch
              options={cardSetFilters}
              query={setQuery}
              selectedValue={selectedCardSet}
              onQueryChange={onSetQueryChange}
              onSelect={onSelectCardSet}
            />
            <Button variant="contained" onClick={onSearch}>
              Buscar
            </Button>
            <TextField
              select
              label="Paginación"
              value={String(cardPageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="24">24 por página</MenuItem>
              <MenuItem value="48">48 por página</MenuItem>
              <MenuItem value="72">72 por página</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Cartas disponibles ({cards.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {visibleCards.map((card) => (
                <CatalogItemCard
                  key={card.id}
                  variant="rich"
                  imageUrl={card.card_images?.[0]?.image_url_small}
                  imageAlt={`Imagen de ${card.name}`}
                  title={card.name}
                  subtitle={`${card.type ?? 'Sin tipo'}${card.frameType ? ` (${card.frameType})` : ''}`}
                  meta={
                    <>
                      {card.attribute && <small>Atributo: {card.attribute}</small>}
                      {card.race && <small>Raza: {card.race}</small>}
                      {card.level ? <small>Nivel/Rango: {card.level}</small> : null}
                      {card.atk !== null ? <small>ATK: {card.atk}</small> : null}
                      {card.def !== null ? <small>DEF: {card.def}</small> : null}
                    </>
                  }
                  description={card.desc ?? undefined}
                  footer={
                    <>
                      {card.archetype && <small>Arquetipo: {card.archetype}</small>}
                      {card.card_sets && card.card_sets.length > 0 && (
                        <small>
                          Sets:{' '}
                          {Array.from(new Set(card.card_sets.map((entry) => entry.set_code)))
                            .slice(0, 3)
                            .join(', ')}
                        </small>
                      )}
                      {card.card_prices?.[0] && (
                        <small>
                          Precios - CM: {card.card_prices[0].cardmarket_price ?? '-'} | eBay:{' '}
                          {card.card_prices[0].ebay_price ?? '-'} | Amazon:{' '}
                          {card.card_prices[0].amazon_price ?? '-'}
                        </small>
                      )}
                    </>
                  }
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={onPrevPage} disabled={cardPage <= 1}>
                Anterior
              </Button>
              <Typography variant="body2">Página {cardPage}</Typography>
              <Button onClick={onNextPage} disabled={!hasNextCardPage}>
                Siguiente
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Sets disponibles ({sets.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {sets.map((set) => (
                <Box key={set.id} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, p: 1.25 }}>
                  <Typography sx={{ fontWeight: 600 }}>{set.code}</Typography>
                  <Typography variant="body2" color="text.secondary">{set.name}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default CatalogSection
