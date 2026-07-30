<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CardPrint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    public function base(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'card_print_id' => ['required', 'uuid', 'exists:card_prints,id'],
        ]);

        $print = CardPrint::query()->findOrFail($validated['card_print_id']);

        $source = 'none';
        $basePrice = null;

        if (! is_null($print->price_cardmarket)) {
            $source = 'price_cardmarket';
            $basePrice = (float) $print->price_cardmarket;
        }

        return response()->json([
            'card_print_id' => $print->id,
            'print_code' => $print->print_code,
            'source' => $source,
            'base_price' => $basePrice,
            'currency' => 'EUR',
        ]);
    }
}
