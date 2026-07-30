import { useParams } from 'react-router-dom'
import ModulePlaceholder from '../../../shared/ui/ModulePlaceholder'

function StoreLandingPage() {
  const { storeId } = useParams()

  return (
    <ModulePlaceholder
      title={`Landing publica de tienda: ${storeId ?? 'sin-id'}`}
      description="Vista de tienda orientada a confianza, destacados y conversion sin patron de ecommerce pesado."
      tags={['Hero sobrio', 'Destacados', 'Reviews verificadas']}
    />
  )
}

export default StoreLandingPage
