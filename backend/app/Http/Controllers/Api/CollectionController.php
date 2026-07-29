<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CollectionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $collection = $this->getOrCreateCollection($request->user()->id);

        $collection->load([
            'items:id,collection_id,card_print_id,quantity,condition,language,is_foil,notes',
            'items.cardPrint:id,card_id,set_id,rarity,print_code,price_tcgplayer,price_cardmarket,image_url',
            'items.cardPrint.card:id,name,type,attribute,race,archetype',
            'items.cardPrint.set:id,code,name',
        ]);

        $estimatedValue = $collection->items->sum(function (CollectionItem $item): float {
            $unitPrice = (float) ($item->cardPrint?->price_tcgplayer ?? $item->cardPrint?->price_cardmarket ?? 0);
            return $unitPrice * (int) $item->quantity;
        });

        return response()->json([
            'collection' => $collection,
            'summary' => [
                'distinct_items' => $collection->items->count(),
                'total_cards' => (int) $collection->items->sum('quantity'),
                'estimated_value' => round($estimatedValue, 2),
            ],
        ]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'card_print_id' => ['required', 'uuid', 'exists:card_prints,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'condition' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', 'max:10'],
            'is_foil' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $collection = $this->getOrCreateCollection($request->user()->id);

        $item = CollectionItem::query()
            ->where('collection_id', $collection->id)
            ->where('card_print_id', $validated['card_print_id'])
            ->where('condition', $validated['condition'] ?? null)
            ->where('language', $validated['language'] ?? null)
            ->where('is_foil', $validated['is_foil'] ?? false)
            ->first();

        if ($item) {
            $item->quantity += (int) $validated['quantity'];
            if (array_key_exists('notes', $validated)) {
                $item->notes = $validated['notes'];
            }
            $item->save();
        } else {
            $item = $collection->items()->create([
                'card_print_id' => $validated['card_print_id'],
                'quantity' => $validated['quantity'],
                'condition' => $validated['condition'] ?? null,
                'language' => $validated['language'] ?? null,
                'is_foil' => $validated['is_foil'] ?? false,
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        return response()->json($this->loadItem($item), 201);
    }

    public function updateItem(Request $request, CollectionItem $item): JsonResponse
    {
        $this->authorizeItemOwnership($item, $request->user()->id);

        $validated = $request->validate([
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'condition' => ['sometimes', 'nullable', 'string', 'max:255'],
            'language' => ['sometimes', 'nullable', 'string', 'max:10'],
            'is_foil' => ['sometimes', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $item->update($validated);

        return response()->json($this->loadItem($item->fresh()));
    }

    public function destroyItem(Request $request, CollectionItem $item): JsonResponse
    {
        $this->authorizeItemOwnership($item, $request->user()->id);
        $item->delete();

        return response()->json(['message' => 'Item eliminado de la coleccion']);
    }

    private function getOrCreateCollection(string $userId): Collection
    {
        return Collection::firstOrCreate(['user_id' => $userId]);
    }

    private function authorizeItemOwnership(CollectionItem $item, string $userId): void
    {
        $ownerId = $item->collection()->value('user_id');
        abort_if($ownerId !== $userId, 403, 'No puedes modificar elementos de otra coleccion.');
    }

    private function loadItem(CollectionItem $item): CollectionItem
    {
        return $item->load([
            'cardPrint:id,card_id,set_id,rarity,print_code,price_tcgplayer,price_cardmarket,image_url',
            'cardPrint.card:id,name,type,attribute,race,archetype',
            'cardPrint.set:id,code,name',
        ]);
    }
}