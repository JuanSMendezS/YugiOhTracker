<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CardCatalogController;
use App\Http\Controllers\Api\SetCatalogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/cards', [CardCatalogController::class, 'index']);
Route::get('/sets', [SetCatalogController::class, 'index']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
