<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreInventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user?->profile?->type !== 'tienda', 403, 'Solo las cuentas de tienda tienen inventario comercial.');

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:disponible,reservado,vendido,pausado'],
            'asset_type' => ['nullable', 'string', 'in:carta_individual,playset,base,producto_sellado'],
            'q' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'string', 'in:price,created_at,updated_at,quantity'],
            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
        ]);

        $query = Listing::query()
            ->where('user_id', $user->id)
            ->with([
                'cardPrint:id,card_id,set_id,rarity,print_code,price_tcgplayer,price_cardmarket,image_url',
                'cardPrint.card:id,name,type,attribute,race,archetype',
                'cardPrint.set:id,code,name',
                'items:id,listing_id,card_print_id,quantity',
                'images:id,listing_id,image_path',
            ]);

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['asset_type'])) {
            $query->where('asset_type', $validated['asset_type']);
        }

        if (! empty($validated['q'])) {
            $term = $validated['q'];
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('title', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('cardPrint.card', function ($sub) use ($term): void {
                        $sub->where('name', 'like', "%{$term}%");
                    });
            });
        }

        $sortBy = $validated['sort_by'] ?? 'updated_at';
        $sortDir = $validated['sort_dir'] ?? 'desc';
        $perPage = $validated['per_page'] ?? 20;

        $inventory = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($inventory);
    }
}