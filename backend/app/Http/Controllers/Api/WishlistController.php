<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $wishlist = $this->getOrCreateWishlist($request->user()->id);

        $wishlist->load([
            'items:id,wishlist_id,card_id,priority,target_price,notes',
            'items.card:id,name,type,attribute,race,archetype',
        ]);

        return response()->json($wishlist);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'card_id' => ['required', 'uuid', 'exists:cards,id'],
            'priority' => ['nullable', 'string', 'in:alta,media,baja'],
            'target_price' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $wishlist = $this->getOrCreateWishlist($request->user()->id);

        $item = WishlistItem::firstOrNew([
            'wishlist_id' => $wishlist->id,
            'card_id' => $validated['card_id'],
        ]);

        $item->priority = $validated['priority'] ?? $item->priority ?? 'media';
        $item->target_price = $validated['target_price'] ?? $item->target_price;
        $item->notes = $validated['notes'] ?? $item->notes;
        $item->save();

        return response()->json($this->loadItem($item), 201);
    }

    public function updateItem(Request $request, WishlistItem $item): JsonResponse
    {
        $this->authorizeItemOwnership($item, $request->user()->id);

        $validated = $request->validate([
            'priority' => ['sometimes', 'string', 'in:alta,media,baja'],
            'target_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $item->update($validated);

        return response()->json($this->loadItem($item->fresh()));
    }

    public function destroyItem(Request $request, WishlistItem $item): JsonResponse
    {
        $this->authorizeItemOwnership($item, $request->user()->id);
        $item->delete();

        return response()->json(['message' => 'Item eliminado de la wishlist']);
    }

    private function getOrCreateWishlist(string $userId): Wishlist
    {
        return Wishlist::firstOrCreate(['user_id' => $userId]);
    }

    private function authorizeItemOwnership(WishlistItem $item, string $userId): void
    {
        $ownerId = $item->wishlist()->value('user_id');
        abort_if($ownerId !== $userId, 403, 'No puedes modificar elementos de otra wishlist.');
    }

    private function loadItem(WishlistItem $item): WishlistItem
    {
        return $item->load(['card:id,name,type,attribute,race,archetype']);
    }
}