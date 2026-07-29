# YugiHub (YugiOhTracker)

Plataforma para gestionar catalogo de cartas de Yu-Gi-Oh!, perfiles de usuarios/tiendas, marketplace, coleccion personal y deck builder.

## Estado actual

- Backend API en Laravel (UUID + Sanctum) en avance funcional.
- Frontend en React + Vite inicial (la integracion completa con API sigue en fases posteriores).
- Fases completadas:
  - Fase 1: Inicializacion del backend.
  - Fase 2: Modelos y migraciones de dominio.
  - Fase 3: Sincronizacion de catalogo desde YGOPRODeck.
  - Fase 4: Endpoints de autenticacion y catalogo.

## Stack

- Frontend: React 19, TypeScript, Vite.
- Backend: Laravel, Sanctum.
- Base de datos: SQLite por defecto (desarrollo agil).

## Estructura del proyecto

- raiz: cliente React y configuracion de Vite.
- backend/: API Laravel y logica de dominio.
- docs/: documentacion de producto/diseno (actualmente excluida del versionado por gitignore).

## Endpoints disponibles (Fase 4)

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout (requiere token Bearer)
- GET /api/cards (busqueda y filtros)
- GET /api/sets (busqueda y filtros)
- GET /api/user (requiere token Bearer)

## Puesta en marcha local

### 1) Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Opcional: sincronizar catalogo inicial

```bash
php artisan app:sync-catalog --limit=200
```

### 2) Frontend

```bash
npm install
npm run dev
```

## Roadmap inmediato

- Fase 5: CRUD de publicaciones + inventario de tienda.
- Fase 6: coleccion, wishlist, deck builder y pedidos.
- Fase 7: integracion completa del frontend con la API.
