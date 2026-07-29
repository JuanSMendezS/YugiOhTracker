<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ListingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:disponible,reservado,vendido,pausado'],
            'asset_type' => ['nullable', 'string', 'in:carta_individual,playset,base,producto_sellado'],
            'currency' => ['nullable', 'string', 'size:3'],
            'condition' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', 'max:10'],
            'seller_id' => ['nullable', 'uuid'],
            'card_name' => ['nullable', 'string', 'max:255'],
            'set_code' => ['nullable', 'string', 'max:255'],
            'price_min' => ['nullable', 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'string', 'in:price,created_at,updated_at'],
            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
        ]);

        $query = Listing::query()
            ->with([
                'user:id,name',
                'user.profile:id,user_id,type,display_name',
                'cardPrint:id,card_id,set_id,rarity,print_code,price_tcgplayer,price_cardmarket,image_url',
                'cardPrint.card:id,name,type,attribute,race,archetype',
                'cardPrint.set:id,code,name',
                'items:id,listing_id,card_print_id,quantity',
                'items.cardPrint:id,card_id,set_id,print_code,rarity',
                'images:id,listing_id,image_path',
            ]);

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

        foreach (['status', 'asset_type', 'currency', 'condition', 'language'] as $field) {
            if (! empty($validated[$field])) {
                $query->where($field, $validated[$field]);
            }
        }

        if (! empty($validated['seller_id'])) {
            $query->where('user_id', $validated['seller_id']);
        }

        if (! empty($validated['card_name'])) {
            $cardName = $validated['card_name'];
            $query->whereHas('cardPrint.card', function ($builder) use ($cardName): void {
                $builder->where('name', 'like', "%{$cardName}%");
            });
        }

        if (! empty($validated['set_code'])) {
            $setCode = $validated['set_code'];
            $query->whereHas('cardPrint.set', function ($builder) use ($setCode): void {
                $builder->where('code', 'like', "%{$setCode}%");
            });
        }

        if (isset($validated['price_min'])) {
            $query->where('price', '>=', $validated['price_min']);
        }

        if (isset($validated['price_max'])) {
            $query->where('price', '<=', $validated['price_max']);
        }

        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortDir = $validated['sort_dir'] ?? 'desc';
        $perPage = $validated['per_page'] ?? 20;

        $listings = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($listings);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureStoreProfile($user?->profile?->type);

        $validated = $request->validate([
            'card_print_id' => ['nullable', 'uuid', 'exists:card_prints,id'],
            'asset_type' => ['required', 'string', 'in:carta_individual,playset,base,producto_sellado'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'in:disponible,reservado,vendido,pausado'],
            'condition' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', 'max:10'],
            'items' => ['nullable', 'array'],
            'items.*.card_print_id' => ['required_with:items', 'uuid', 'exists:card_prints,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'images' => ['nullable', 'array'],
            'images.*' => ['required', 'string', 'max:2048'],
        ]);

        $listing = DB::transaction(function () use ($validated, $user): Listing {
            $listing = Listing::create([
                'user_id' => $user->id,
                'card_print_id' => $validated['card_print_id'] ?? null,
                'asset_type' => $validated['asset_type'],
                'title' => $validated['title'] ?? null,
                'description' => $validated['description'] ?? null,
                'price' => $validated['price'],
                'currency' => strtoupper($validated['currency'] ?? 'COP'),
                'quantity' => $validated['quantity'] ?? 1,
                'status' => $validated['status'] ?? 'disponible',
                'condition' => $validated['condition'] ?? null,
                'language' => $validated['language'] ?? null,
            ]);

            if (! empty($validated['items'])) {
                $listing->items()->createMany($validated['items']);
            }

            if (! empty($validated['images'])) {
                $images = array_map(static fn (string $path): array => ['image_path' => $path], $validated['images']);
                $listing->images()->createMany($images);
            }

            return $listing;
        });

        return response()->json($this->loadListing($listing), 201);
    }

    public function show(Listing $listing): JsonResponse
    {
        return response()->json($this->loadListing($listing));
    }

    public function update(Request $request, Listing $listing): JsonResponse
    {
        $user = $request->user();
        $this->ensureOwner($listing->user_id, $user?->id);

        $validated = $request->validate([
            'card_print_id' => ['sometimes', 'nullable', 'uuid', 'exists:card_prints,id'],
            'asset_type' => ['sometimes', 'string', 'in:carta_individual,playset,base,producto_sellado'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'string', 'in:disponible,reservado,vendido,pausado'],
            'condition' => ['sometimes', 'nullable', 'string', 'max:255'],
            'language' => ['sometimes', 'nullable', 'string', 'max:10'],
            'items' => ['sometimes', 'array'],
            'items.*.card_print_id' => ['required_with:items', 'uuid', 'exists:card_prints,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'images' => ['sometimes', 'array'],
            'images.*' => ['required', 'string', 'max:2048'],
        ]);

        DB::transaction(function () use ($listing, $validated): void {
            $payload = collect($validated)
                ->except(['items', 'images'])
                ->toArray();

            if (array_key_exists('currency', $payload) && ! is_null($payload['currency'])) {
                $payload['currency'] = strtoupper($payload['currency']);
            }

            if (! empty($payload)) {
                $listing->update($payload);
            }

            if (array_key_exists('items', $validated)) {
                $listing->items()->delete();
                if (! empty($validated['items'])) {
                    $listing->items()->createMany($validated['items']);
                }
            }

            if (array_key_exists('images', $validated)) {
                $listing->images()->delete();
                if (! empty($validated['images'])) {
                    $images = array_map(static fn (string $path): array => ['image_path' => $path], $validated['images']);
                    $listing->images()->createMany($images);
                }
            }
        });

        return response()->json($this->loadListing($listing->fresh()));
    }

    public function destroy(Request $request, Listing $listing): JsonResponse
    {
        $user = $request->user();
        $this->ensureOwner($listing->user_id, $user?->id);

        $listing->delete();

        return response()->json([
            'message' => 'Publicacion eliminada',
        ]);
    }

    private function ensureStoreProfile(?string $profileType): void
    {
        abort_if($profileType !== 'tienda', 403, 'Solo las cuentas de tienda pueden crear publicaciones.');
    }

    private function ensureOwner(string $listingUserId, ?string $userId): void
    {
        abort_if($listingUserId !== $userId, 403, 'No puedes modificar una publicacion que no te pertenece.');
    }

    private function loadListing(Listing $listing): Listing
    {
        return $listing->load([
            'user:id,name',
            'user.profile:id,user_id,type,display_name',
            'cardPrint:id,card_id,set_id,rarity,print_code,price_tcgplayer,price_cardmarket,image_url',
            'cardPrint.card:id,name,type,attribute,race,archetype',
            'cardPrint.set:id,code,name',
            'items:id,listing_id,card_print_id,quantity',
            'items.cardPrint:id,card_id,set_id,print_code,rarity',
            'images:id,listing_id,image_path',
        ]);
    }
}