<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CardCatalogController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\SetCatalogController;
use App\Http\Controllers\Api\StoreInventoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/cards', [CardCatalogController::class, 'index']);
Route::get('/sets', [SetCatalogController::class, 'index']);
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{listing}', [ListingController::class, 'show']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/listings', [ListingController::class, 'store']);
    Route::put('/listings/{listing}', [ListingController::class, 'update']);
    Route::delete('/listings/{listing}', [ListingController::class, 'destroy']);

    Route::get('/inventory/store', [StoreInventoryController::class, 'index']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
