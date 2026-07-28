<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Set;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SetCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'card_name' => ['nullable', 'string', 'max:255'],
            'archetype' => ['nullable', 'string', 'max:255'],
            'sort_by' => ['nullable', 'string', 'in:name,code,created_at,prints_count'],
            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Set::query()->withCount('prints');

        if (! empty($validated['q'])) {
            $searchTerm = $validated['q'];
            $query->where(function ($builder) use ($searchTerm): void {
                $builder
                    ->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('code', 'like', "%{$searchTerm}%");
            });
        }

        if (! empty($validated['code'])) {
            $query->where('code', 'like', "%{$validated['code']}%");
        }

        if (! empty($validated['name'])) {
            $query->where('name', 'like', "%{$validated['name']}%");
        }

        if (! empty($validated['card_name'])) {
            $cardName = $validated['card_name'];
            $query->whereHas('prints.card', function ($builder) use ($cardName): void {
                $builder->where('name', 'like', "%{$cardName}%");
            });
        }

        if (! empty($validated['archetype'])) {
            $archetype = $validated['archetype'];
            $query->whereHas('prints.card', function ($builder) use ($archetype): void {
                $builder->where('archetype', 'like', "%{$archetype}%");
            });
        }

        $sortBy = $validated['sort_by'] ?? 'name';
        $sortDir = $validated['sort_dir'] ?? 'asc';
        $perPage = $validated['per_page'] ?? 20;

        $sets = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($sets);
    }
}