<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
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

        $query = Card::query()->withCount('prints');

        if (! empty($validated['q'])) {
            $searchTerm = $validated['q'];
            $query->where(function ($builder) use ($searchTerm): void {
                $builder
                    ->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhere('archetype', 'like', "%{$searchTerm}%");
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

        return response()->json($cards);
    }
}