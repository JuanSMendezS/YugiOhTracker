<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardPrint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CardCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'frame_type' => ['nullable', 'string', 'max:255'],
            'attribute' => ['nullable', 'string', 'max:255'],
            'race' => ['nullable', 'string', 'max:255'],
            'archetype' => ['nullable', 'string', 'max:255'],
            'set_code' => ['nullable', 'string', 'max:255'],
            'set_name' => ['nullable', 'string', 'max:255'],
            'rarity' => ['nullable', 'string', 'max:255'],
            'level_min' => ['nullable', 'integer', 'min:0'],
            'level_max' => ['nullable', 'integer', 'min:0'],
            'atk_min' => ['nullable', 'integer', 'min:0'],
            'atk_max' => ['nullable', 'integer', 'min:0'],
            'def_min' => ['nullable', 'integer', 'min:0'],
            'def_max' => ['nullable', 'integer', 'min:0'],
            'sort_by' => ['nullable', 'string', 'in:name,level,atk,def,created_at'],
            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Card::query()
            ->withCount('prints')
            ->with(['prints' => function ($builder): void {
                $builder
                    ->select('id', 'card_id', 'set_id', 'rarity', 'print_code', 'price_cardmarket', 'image_url')
                    ->orderBy('print_code');
            }, 'prints.set:id,code,name']);

        if (! empty($validated['q'])) {
            $searchTerms = collect(preg_split('/\s+/', trim($validated['q'])) ?: [])
                ->filter(fn ($term): bool => $term !== '')
                ->values();

            $query->where(function ($builder) use ($searchTerms): void {
                foreach ($searchTerms as $searchTerm) {
                    $builder
                        ->orWhere('name', 'like', "%{$searchTerm}%")
                        ->orWhere('description', 'like', "%{$searchTerm}%")
                        ->orWhere('archetype', 'like', "%{$searchTerm}%")
                        ->orWhere('type', 'like', "%{$searchTerm}%")
                        ->orWhere('race', 'like', "%{$searchTerm}%")
                        ->orWhere('attribute', 'like', "%{$searchTerm}%");
                }
            });
        }

        foreach (['type', 'frame_type', 'attribute', 'race', 'archetype'] as $field) {
            if (! empty($validated[$field])) {
                $query->where($field, $validated[$field]);
            }
        }

        if (isset($validated['level_min'])) {
            $query->where('level', '>=', $validated['level_min']);
        }

        if (isset($validated['level_max'])) {
            $query->where('level', '<=', $validated['level_max']);
        }

        if (isset($validated['atk_min'])) {
            $query->where('atk', '>=', $validated['atk_min']);
        }

        if (isset($validated['atk_max'])) {
            $query->where('atk', '<=', $validated['atk_max']);
        }

        if (isset($validated['def_min'])) {
            $query->where('def', '>=', $validated['def_min']);
        }

        if (isset($validated['def_max'])) {
            $query->where('def', '<=', $validated['def_max']);
        }

        if (! empty($validated['set_code'])) {
            $setCode = $validated['set_code'];
            $query->whereHas('prints.set', function ($builder) use ($setCode): void {
                $builder->where('code', 'like', "%{$setCode}%");
            });
        }

        if (! empty($validated['set_name'])) {
            $setName = $validated['set_name'];
            $query->whereHas('prints.set', function ($builder) use ($setName): void {
                $builder->where('name', 'like', "%{$setName}%");
            });
        }

        if (! empty($validated['rarity'])) {
            $rarity = $validated['rarity'];
            $query->whereHas('prints', function ($builder) use ($rarity): void {
                $builder->where('rarity', 'like', "%{$rarity}%");
            });
        }

        $sortBy = $validated['sort_by'] ?? 'name';
        $sortDir = $validated['sort_dir'] ?? 'asc';
        $perPage = $validated['per_page'] ?? 20;

        $cards = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        $cards->through(function (Card $card): array {
            $firstPrint = $card->prints->first();
            $lowestPrice = CardPrint::query()
                ->where('card_id', $card->id)
                ->min('price_cardmarket');

            return [
                'id' => $card->id,
                'name' => $card->name,
                'type' => $card->type,
                'frameType' => $card->frame_type,
                'desc' => $card->description,
                'atk' => $card->atk,
                'def' => $card->def,
                'level' => $card->level,
                'attribute' => $card->attribute,
                'race' => $card->race,
                'archetype' => $card->archetype,
                'prints_count' => $card->prints_count,
                'card_sets' => $card->prints->map(fn ($print): array => [
                    'set_name' => $print->set?->name ?? '',
                    'set_code' => $print->set?->code ?? '',
                    'set_rarity' => $print->rarity,
                    'set_price' => $print->price_cardmarket !== null ? (string) $print->price_cardmarket : null,
                ])->values(),
                'card_images' => $firstPrint?->image_url ? [[
                    'image_url' => $firstPrint->image_url,
                    'image_url_small' => $firstPrint->image_url,
                    'image_url_cropped' => $firstPrint->image_url,
                ]] : [],
                'card_prices' => [[
                    'cardmarket_price' => $lowestPrice !== null ? (string) $lowestPrice : '0',
                ]],
            ];
        });

        return response()->json($cards);
    }
}