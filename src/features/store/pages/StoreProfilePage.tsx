import { useParams } from 'react-router-dom'
import ModulePlaceholder from '../../../shared/ui/ModulePlaceholder'

function StoreProfilePage() {
  const { storeId } = useParams()

  return (
    <ModulePlaceholder
      title={`Perfil de tienda: ${storeId ?? 'sin-id'}`}
      description="Panel operativo de inventario, rotacion, ventas y publicaciones para cuentas comerciales."
      tags={['Dashboard tienda', 'Inventario', 'Publicacion masiva']}
    />
  )
}

export default StoreProfilePage
