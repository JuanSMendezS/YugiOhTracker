<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogManagementController;
use App\Http\Controllers\Api\CardCatalogController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\DeckController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PricingController;
use App\Http\Controllers\Api\SetCatalogController;
use App\Http\Controllers\Api\StoreInventoryController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/cards', [CardCatalogController::class, 'index']);
Route::get('/sets', [SetCatalogController::class, 'index']);
Route::get('/catalog/status', [CatalogManagementController::class, 'status']);
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{listing}', [ListingController::class, 'show']);
Route::get('/pricing/base', [PricingController::class, 'base']);

Route::get('/session', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'authenticated' => (bool) $user,
        'user' => $user?->load('profile'),
    ]);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/listings', [ListingController::class, 'store']);
    Route::put('/listings/{listing}', [ListingController::class, 'update']);
    Route::delete('/listings/{listing}', [ListingController::class, 'destroy']);

    Route::get('/inventory/store', [StoreInventoryController::class, 'index']);

    Route::get('/collection/items', [CollectionController::class, 'index']);
    Route::post('/collection/items', [CollectionController::class, 'storeItem']);
    Route::put('/collection/items/{item}', [CollectionController::class, 'updateItem']);
    Route::delete('/collection/items/{item}', [CollectionController::class, 'destroyItem']);

    Route::get('/wishlist/items', [WishlistController::class, 'index']);
    Route::post('/wishlist/items', [WishlistController::class, 'storeItem']);
    Route::put('/wishlist/items/{item}', [WishlistController::class, 'updateItem']);
    Route::delete('/wishlist/items/{item}', [WishlistController::class, 'destroyItem']);

    Route::get('/decks', [DeckController::class, 'index']);
    Route::post('/decks', [DeckController::class, 'store']);
    Route::get('/decks/{deck}', [DeckController::class, 'show']);
    Route::put('/decks/{deck}', [DeckController::class, 'update']);
    Route::delete('/decks/{deck}', [DeckController::class, 'destroy']);
    Route::post('/decks/{deck}/versions', [DeckController::class, 'createVersion']);
    Route::get('/decks/{deck}/versions/{version}', [DeckController::class, 'showVersion']);

    Route::post('/orders/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders/history', [OrderController::class, 'history']);

    Route::post('/catalog/sync', [CatalogManagementController::class, 'sync']);
});

Route::get('/user', function (Request $request) {
    return $request->user()?->load('profile');
})->middleware('auth:sanctum');
