import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material'
import type { ApiCard, DeckDetail, DeckDraftCard, DeckSummary } from '../../types/app'

type DecksSectionProps = {
  canCreateDeck: boolean
  selectableCards: ApiCard[]
  decks: DeckSummary[]
  selectedDeck: DeckDetail | null
  deckName: string
  deckDescription: string
  draftCardId: string
  draftCardQty: string
  draftCardSection: 'main' | 'extra' | 'side'
  draftCards: DeckDraftCard[]
  versionName: string
  copyFromVersionId: string
  onDeckNameChange: (value: string) => void
  onDeckDescriptionChange: (value: string) => void
  onDraftCardIdChange: (value: string) => void
  onDraftCardQtyChange: (value: string) => void
  onDraftCardSectionChange: (value: 'main' | 'extra' | 'side') => void
  onAddDraftCard: () => void
  onCreateDeck: () => void
  onLoadDeck: (deckId: string) => void
  onVersionNameChange: (value: string) => void
  onCopyFromVersionIdChange: (value: string) => void
  onCreateVersion: () => void
}

function DecksSection({
  canCreateDeck,
  selectableCards,
  decks,
  selectedDeck,
  deckName,
  deckDescription,
  draftCardId,
  draftCardQty,
  draftCardSection,
  draftCards,
  versionName,
  copyFromVersionId,
  onDeckNameChange,
  onDeckDescriptionChange,
  onDraftCardIdChange,
  onDraftCardQtyChange,
  onDraftCardSectionChange,
  onAddDraftCard,
  onCreateDeck,
  onLoadDeck,
  onVersionNameChange,
  onCopyFromVersionIdChange,
  onCreateVersion,
}: DecksSectionProps) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {!canCreateDeck && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Puedes explorar esta vista, pero para crear decks y versiones debes iniciar sesión.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Crear deck
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField label="Nombre del deck" value={deckName} onChange={(event) => onDeckNameChange(event.target.value)} disabled={!canCreateDeck} fullWidth />
              <TextField label="Descripción" value={deckDescription} onChange={(event) => onDeckDescriptionChange(event.target.value)} disabled={!canCreateDeck} fullWidth />
              <TextField select label="Carta" value={draftCardId} onChange={(event) => onDraftCardIdChange(event.target.value)} disabled={!canCreateDeck}>
                <MenuItem value="">Selecciona carta</MenuItem>
                {selectableCards.map((card) => (
                  <MenuItem key={card.id} value={card.id}>
                    {card.name}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <TextField label="Qty" value={draftCardQty} onChange={(event) => onDraftCardQtyChange(event.target.value)} disabled={!canCreateDeck} />
                <TextField select label="Sección" value={draftCardSection} onChange={(event) => onDraftCardSectionChange(event.target.value as 'main' | 'extra' | 'side')} disabled={!canCreateDeck}>
                  <MenuItem value="main">main</MenuItem>
                  <MenuItem value="extra">extra</MenuItem>
                  <MenuItem value="side">side</MenuItem>
                </TextField>
              </Box>
              <Button variant="outlined" onClick={onAddDraftCard} disabled={!canCreateDeck}>
                Agregar carta
              </Button>
              <Box sx={{ display: 'grid', gap: 0.75 }}>
                {draftCards.map((card, index) => (
                  <Typography key={`${card.card_id}-${index}`} variant="body2">
                    {card.card_id.slice(0, 8)}... x{card.quantity} [{card.section}]
                  </Typography>
                ))}
              </Box>
              <Button variant="contained" onClick={onCreateDeck} disabled={!canCreateDeck}>
                Crear deck
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Mis decks
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {decks.map((deck) => (
                <Button key={deck.id} variant="text" onClick={() => onLoadDeck(deck.id)} sx={{ justifyContent: 'flex-start' }}>
                  {deck.name}
                </Button>
              ))}
            </Box>

            {selectedDeck && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">{selectedDeck.name}</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {selectedDeck.description ?? 'Sin descripción'}
                </Typography>
                <Box sx={{ display: 'grid', gap: 0.75 }}>
                  {selectedDeck.versions.map((version) => (
                    <Typography key={version.id} variant="body2">
                      {version.version_name}: {version.summary.total_cards} cartas · costo estimado {version.summary.estimated_total_cost}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ display: 'grid', gap: 1.5, mt: 2 }}>
                  <TextField label="Nombre de nueva versión" value={versionName} onChange={(event) => onVersionNameChange(event.target.value)} disabled={!canCreateDeck} />
                  <TextField select label="Copiar versión" value={copyFromVersionId} onChange={(event) => onCopyFromVersionIdChange(event.target.value)} disabled={!canCreateDeck}>
                    <MenuItem value="">No copiar versión</MenuItem>
                    {selectedDeck.versions.map((version) => (
                      <MenuItem key={version.id} value={version.id}>
                        Copiar {version.version_name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button variant="contained" onClick={onCreateVersion} disabled={!canCreateDeck}>
                    Crear versión
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default DecksSection
