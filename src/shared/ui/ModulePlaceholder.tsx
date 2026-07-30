import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type ModulePlaceholderProps = {
  title: string
  description: string
  tags?: string[]
  actions?: ReactNode
}

function ModulePlaceholder({ title, description, tags = [], actions }: ModulePlaceholderProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75 }}>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          </Box>

          {tags.length > 0 && (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1.2}>
            {actions ?? (
              <>
                <Button variant="contained">Accion principal</Button>
                <Button variant="outlined">Accion secundaria</Button>
              </>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default ModulePlaceholder
