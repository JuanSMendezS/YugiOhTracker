import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material'
import type { ApiCard } from '../../types/app'

type CollectionSectionProps = {
  collectionSummary: { total_cards: number; distinct_items: number; estimated_value: number } | null
  availablePrints: Array<{ printId: string; label: string }>
  selectableCards: ApiCard[]
  wishlistItems: Array<{ id: string; priority: string; card: { name: string } }>
  canManageCollection: boolean
  collectionPrintId: string
  collectionQty: string
  wishlistCardId: string
  wishlistPriority: string
  onCollectionPrintIdChange: (value: string) => void
  onCollectionQtyChange: (value: string) => void
  onWishlistCardIdChange: (value: string) => void
  onWishlistPriorityChange: (value: string) => void
  onAddCollection: () => void
  onAddWishlist: () => void
}

function CollectionSection({
  collectionSummary,
  availablePrints,
  selectableCards,
  wishlistItems,
  canManageCollection,
  collectionPrintId,
  collectionQty,
  wishlistCardId,
  wishlistPriority,
  onCollectionPrintIdChange,
  onCollectionQtyChange,
  onWishlistCardIdChange,
  onWishlistPriorityChange,
  onAddCollection,
  onAddWishlist,
}: CollectionSectionProps) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {canManageCollection ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total cartas</Typography>
                <Typography variant="h4">{collectionSummary?.total_cards ?? 0}</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6">Items distintos</Typography>
                <Typography variant="h4">{collectionSummary?.distinct_items ?? 0}</Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6">Valor estimado</Typography>
                <Typography variant="h4">{collectionSummary?.estimated_value ?? 0}</Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Agregar a colección
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <TextField select label="Selecciona un print" value={collectionPrintId} onChange={(event) => onCollectionPrintIdChange(event.target.value)}>
                    <MenuItem value="">Selecciona un print</MenuItem>
                    {availablePrints.map((item) => (
                      <MenuItem key={item.printId} value={item.printId}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField label="Cantidad" value={collectionQty} onChange={(event) => onCollectionQtyChange(event.target.value)} />
                  <Button variant="contained" onClick={onAddCollection}>Agregar</Button>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Agregar a wishlist
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <TextField select label="Selecciona una carta" value={wishlistCardId} onChange={(event) => onWishlistCardIdChange(event.target.value)}>
                    <MenuItem value="">Selecciona una carta</MenuItem>
                    {selectableCards.map((card) => (
                      <MenuItem key={card.id} value={card.id}>
                        {card.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField select label="Prioridad" value={wishlistPriority} onChange={(event) => onWishlistPriorityChange(event.target.value)}>
                    <MenuItem value="alta">alta</MenuItem>
                    <MenuItem value="media">media</MenuItem>
                    <MenuItem value="baja">baja</MenuItem>
                  </TextField>
                  <Button variant="outlined" onClick={onAddWishlist}>Agregar</Button>
                  <Box sx={{ display: 'grid', gap: 0.75 }}>
                    {wishlistItems.map((item) => (
                      <Box key={item.id} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, p: 1 }}>
                        <Typography variant="body2">{item.card.name} · <strong>{item.priority}</strong></Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </>
      ) : (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Esta sección es solo para usuarios con sesión iniciada. Puedes explorar catálogo y marketplace sin iniciar sesión.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default CollectionSection
