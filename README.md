# YugiHub (YugiOhTracker)

Plataforma lista para gestionar cartas de Yu-Gi-Oh!, perfiles de duelista/tienda, publicaciones de marketplace, coleccion personal, wishlist, deck builder y compras.

## Funcionalidades incluidas

- Autenticacion con Laravel Sanctum (registro, login, logout, usuario actual).
- Catalogo de cartas y sets con busqueda y filtros.
- Marketplace con publicaciones publicas y CRUD para tiendas.
- Marketplace con precio propio por tienda y precio base de referencia.
- Inventario privado por tienda autenticada.
- Gestion de coleccion personal y wishlist.
- Deck builder con versionado y calculo de costo estimado.
- Checkout basico con reserva de stock e historial de compras.
- Integracion opcional con TCGplayer para precios base de impresiones.

## Stack

- Frontend: React 19 + TypeScript + Vite + Axios.
- Backend: Laravel + Sanctum.
- Base de datos: SQLite (por defecto para desarrollo local).

## Estructura

- raiz: cliente web React y configuracion de Vite.
- backend/: API Laravel, modelos, migraciones y tests.
- docs/: documentacion interna (excluida del versionado por gitignore).

## Requisitos

- Node.js 20+
- npm 10+
- PHP 8.2+
- Composer 2+

## Inicio rapido

### 1) Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Opcional: poblar catalogo inicial desde YGOPRODeck

```bash
php artisan app:sync-catalog --limit=200
```

Opcional: activar precios base con TCGplayer

1. Configura credenciales en `backend/.env`:

```env
TCGPLAYER_PUBLIC_KEY=tu_public_key
TCGPLAYER_PRIVATE_KEY=tu_private_key
TCGPLAYER_BASE_URL=https://api.tcgplayer.com/v1.39.0
```

2. Asegura que cada `card_print` tenga `tcgplayer_product_id`.

3. Sincroniza precios:

```bash
php artisan app:sync-tcgplayer-prices
```

Opciones utiles:

```bash
php artisan app:sync-tcgplayer-prices --dry-run
php artisan app:sync-tcgplayer-prices --print-id=<uuid>
```

### 2) Frontend

```bash
npm install
npm run dev
```

El frontend usa proxy de Vite hacia el backend local en http://127.0.0.1:8000 para todas las rutas /api.

## Scripts utiles

- Frontend build: `npm run build`
- Frontend preview: `npm run preview`
- Tests backend: `cd backend && php artisan test`

## Endpoints API principales

### Autenticacion

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/user

### Catalogo

- GET /api/cards
- GET /api/sets

### Marketplace

- GET /api/listings
- GET /api/listings/{listing}
- POST /api/listings
- PUT /api/listings/{listing}
- DELETE /api/listings/{listing}
- GET /api/inventory/store

Notas de precio en publicaciones:

- `price`: precio propio de la tienda (el que se publica y se cobra).
- `base_reference_price`: referencia de mercado basada en TCGplayer/Cardmarket.
- Si envias `card_print_id` sin `price`, la API usa automaticamente el precio base disponible.

### Coleccion y Wishlist

- GET /api/collection/items
- POST /api/collection/items
- PUT /api/collection/items/{item}
- DELETE /api/collection/items/{item}
- GET /api/wishlist/items
- POST /api/wishlist/items
- PUT /api/wishlist/items/{item}
- DELETE /api/wishlist/items/{item}

### Decks

- GET /api/decks
- POST /api/decks
- GET /api/decks/{deck}
- PUT /api/decks/{deck}
- DELETE /api/decks/{deck}
- POST /api/decks/{deck}/versions
- GET /api/decks/{deck}/versions/{version}

### Ordenes

- POST /api/orders/checkout
- GET /api/orders/history

### Pricing

- GET /api/pricing/base?card_print_id=<uuid>
- POST /api/pricing/tcgplayer/sync

### Catalogo operativo

- GET /api/catalog/status
- POST /api/catalog/sync
