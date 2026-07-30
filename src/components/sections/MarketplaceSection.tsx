import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material'
import type { ApiListing } from '../../types/app'

type MarketplaceSectionProps = {
  listings: ApiListing[]
  inventory: ApiListing[]
  isStore: boolean
  canCreateListing: boolean
  listingTitle: string
  listingAssetType: string
  listingPrice: string
  listingQuantity: string
  listingPrintId: string
  availablePrints: Array<{ printId: string; label: string }>
  onRefresh: () => void
  onBuy: () => void
  onListingTitleChange: (value: string) => void
  onListingAssetTypeChange: (value: string) => void
  onListingPriceChange: (value: string) => void
  onListingQuantityChange: (value: string) => void
  onListingPrintIdChange: (value: string) => void
  onCreateListing: () => void
}

function MarketplaceSection({
  listings,
  inventory,
  isStore,
  canCreateListing,
  listingTitle,
  listingAssetType,
  listingPrice,
  listingQuantity,
  listingPrintId,
  availablePrints,
  onRefresh,
  onBuy,
  onListingTitleChange,
  onListingAssetTypeChange,
  onListingPriceChange,
  onListingQuantityChange,
  onListingPrintIdChange,
  onCreateListing,
}: MarketplaceSectionProps) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5 }}>
            <Button variant="contained" onClick={onRefresh}>Refrescar publicaciones</Button>
            <Button variant="outlined" onClick={onBuy}>Compra rápida</Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Publicaciones públicas ({listings.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {listings.map((listing) => (
                <Box key={listing.id} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontWeight: 600 }}>{listing.title ?? listing.cardPrint?.card?.name ?? 'Publicación'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {listing.price} {listing.currency} · qty {listing.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {listing.status} / {listing.asset_type}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Inventario de tienda ({inventory.length})
            </Typography>
            {isStore ? (
              <Box sx={{ display: 'grid', gap: 1.25 }}>
                {inventory.map((listing) => (
                  <Box key={listing.id} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, p: 1.5 }}>
                    <Typography sx={{ fontWeight: 600 }}>{listing.title ?? listing.cardPrint?.card?.name ?? 'Publicación'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {listing.price} {listing.currency} · {listing.status}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">El inventario solo está disponible para perfiles tienda con sesión iniciada.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Crear publicación (solo tienda)
          </Typography>
          {canCreateListing ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField label="Título" value={listingTitle} onChange={(event) => onListingTitleChange(event.target.value)} fullWidth />
              <TextField select label="Tipo de activo" value={listingAssetType} onChange={(event) => onListingAssetTypeChange(event.target.value)}>
                <MenuItem value="carta_individual">carta_individual</MenuItem>
                <MenuItem value="playset">playset</MenuItem>
                <MenuItem value="base">base</MenuItem>
                <MenuItem value="producto_sellado">producto_sellado</MenuItem>
              </TextField>
              <TextField label="Precio" value={listingPrice} onChange={(event) => onListingPriceChange(event.target.value)} fullWidth />
              <TextField label="Cantidad" value={listingQuantity} onChange={(event) => onListingQuantityChange(event.target.value)} fullWidth />
              <TextField select label="Card print" value={listingPrintId} onChange={(event) => onListingPrintIdChange(event.target.value)}>
                <MenuItem value="">Sin card_print_id</MenuItem>
                {availablePrints.map((item) => (
                  <MenuItem key={item.printId} value={item.printId}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={onCreateListing}>Publicar</Button>
            </Box>
          ) : (
            <Typography color="text.secondary">Debes iniciar sesión para crear publicaciones.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default MarketplaceSection
