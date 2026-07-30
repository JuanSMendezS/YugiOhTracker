<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardPrint;
use App\Models\Set;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class CatalogManagementController extends Controller
{
    public function status(): JsonResponse
    {
        $cardsCount = Card::query()->count();
        $setsCount = Set::query()->count();
        $printsCount = CardPrint::query()->count();

        $latestPrintUpdate = CardPrint::query()->max('updated_at');

        return response()->json([
            'cards_count' => $cardsCount,
            'sets_count' => $setsCount,
            'card_prints_count' => $printsCount,
            'latest_card_print_update_at' => $latestPrintUpdate,
            'is_catalog_ready' => $cardsCount > 0 && $setsCount > 0 && $printsCount > 0,
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:5000'],
        ]);

        $params = [];

        if (isset($validated['limit'])) {
            $params['--limit'] = (string) $validated['limit'];
        }

        Artisan::call('app:sync-catalog', $params);

        return response()->json([
            'message' => 'Sincronizacion de catalogo ejecutada',
            'output' => Artisan::output(),
        ]);
    }
}
