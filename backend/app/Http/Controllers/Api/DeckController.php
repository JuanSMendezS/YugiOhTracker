<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardPrint;
use App\Models\Deck;
use App\Models\DeckVersion;
use App\Models\Set;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DeckController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $decks = Deck::query()
            ->where('user_id', $request->user()->id)
            ->withCount('versions')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($decks);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'initial_version_name' => ['nullable', 'string', 'max:255'],
            'cards' => ['nullable', 'array'],
            'cards.*.card_id' => ['required_with:cards', 'string', 'max:64'],
            'cards.*.quantity' => ['required_with:cards', 'integer', 'min:1'],
            'cards.*.section' => ['required_with:cards', 'string', 'in:main,extra,side'],
        ]);

        $mappedCards = collect($validated['cards'] ?? [])->map(function (array $card): array {
            return [
                'card_id' => $this->resolveLocalCardId($card['card_id']),
                'quantity' => $card['quantity'],
                'section' => $card['section'],
            ];
        })->all();

        $deck = DB::transaction(function () use ($request, $validated, $mappedCards): Deck {
            $deck = Deck::create([
                'user_id' => $request->user()->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            $version = $deck->versions()->create([
                'version_name' => $validated['initial_version_name'] ?? 'V1',
            ]);

            if (! empty($mappedCards)) {
                $version->cards()->createMany($mappedCards);
            }

            return $deck;
        });

        return response()->json($this->loadDeckWithCosts($deck->fresh()), 201);
    }

    public function show(Request $request, Deck $deck): JsonResponse
    {
        $this->ensureOwner($deck, $request->user()->id);
        return response()->json($this->loadDeckWithCosts($deck));
    }

    public function update(Request $request, Deck $deck): JsonResponse
    {
        $this->ensureOwner($deck, $request->user()->id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $deck->update($validated);

        return response()->json($this->loadDeckWithCosts($deck->fresh()));
    }

    public function destroy(Request $request, Deck $deck): JsonResponse
    {
        $this->ensureOwner($deck, $request->user()->id);
        $deck->delete();

        return response()->json(['message' => 'Deck eliminado']);
    }

    public function createVersion(Request $request, Deck $deck): JsonResponse
    {
        $this->ensureOwner($deck, $request->user()->id);

        $validated = $request->validate([
            'version_name' => ['required', 'string', 'max:255'],
            'cards' => ['nullable', 'array'],
            'cards.*.card_id' => ['required_with:cards', 'string', 'max:64'],
            'cards.*.quantity' => ['required_with:cards', 'integer', 'min:1'],
            'cards.*.section' => ['required_with:cards', 'string', 'in:main,extra,side'],
            'copy_from_version_id' => ['nullable', 'uuid'],
        ]);

        $mappedCards = collect($validated['cards'] ?? [])->map(function (array $card): array {
            return [
                'card_id' => $this->resolveLocalCardId($card['card_id']),
                'quantity' => $card['quantity'],
                'section' => $card['section'],
            ];
        })->all();

        $version = DB::transaction(function () use ($deck, $validated, $mappedCards): DeckVersion {
            $version = $deck->versions()->create([
                'version_name' => $validated['version_name'],
            ]);

            if (! empty($mappedCards)) {
                $version->cards()->createMany($mappedCards);
                return $version;
            }

            if (! empty($validated['copy_from_version_id'])) {
                $source = DeckVersion::query()
                    ->where('deck_id', $deck->id)
                    ->findOrFail($validated['copy_from_version_id']);

                $cards = $source->cards()
                    ->get(['card_id', 'quantity', 'section'])
                    ->map(fn ($card): array => $card->only(['card_id', 'quantity', 'section']))
                    ->all();

                if (! empty($cards)) {
                    $version->cards()->createMany($cards);
                }
            }

            return $version;
        });

        return response()->json($this->formatVersion($version->fresh()), 201);
    }

    public function showVersion(Request $request, Deck $deck, DeckVersion $version): JsonResponse
    {
        $this->ensureOwner($deck, $request->user()->id);
        abort_if($version->deck_id !== $deck->id, 404, 'Version no encontrada para este deck.');

        return response()->json($this->formatVersion($version));
    }

    private function resolveLocalCardId(string $incomingCardId): string
    {
        $normalized = trim($incomingCardId);
        if ($normalized === '') {
            abort(422, 'card_id invalido');
        }

        if (Str::isUuid($normalized)) {
            $card = Card::query()->find($normalized);
            if (! $card) {
                abort(422, "La carta {$normalized} no existe en el catalogo local.");
            }

            return $card->id;
        }

        $existing = Card::query()->where('external_id', $normalized)->first();
        if ($existing) {
            return $existing->id;
        }

        $response = Http::timeout(15)->get('https://db.ygoprodeck.com/api/v7/cardinfo.php', [
            'id' => $normalized,
        ]);

        if ($response->failed()) {
            abort(422, "No se pudo resolver la carta externa {$normalized}.");
        }

        $payload = $response->json();
        $cardData = $payload['data'][0] ?? null;
        if (! is_array($cardData) || empty($cardData['name'])) {
            abort(422, "La carta externa {$normalized} no fue encontrada.");
        }

        return DB::transaction(function () use ($normalized, $cardData): string {
            $already = Card::query()->where('external_id', $normalized)->first();
            if ($already) {
                return $already->id;
            }

            $card = Card::create([
                'name' => $cardData['name'],
                'external_id' => $normalized,
                'type' => $cardData['type'] ?? null,
                'frame_type' => $cardData['frameType'] ?? null,
                'description' => $cardData['desc'] ?? null,
                'atk' => isset($cardData['atk']) ? (int) $cardData['atk'] : null,
                'def' => isset($cardData['def']) ? (int) $cardData['def'] : null,
                'level' => isset($cardData['level']) ? (int) $cardData['level'] : null,
                'race' => $cardData['race'] ?? null,
                'attribute' => $cardData['attribute'] ?? null,
                'archetype' => $cardData['archetype'] ?? null,
            ]);

            $imageUrl = $cardData['card_images'][0]['image_url'] ?? null;
            $marketPrice = $cardData['card_prices'][0]['cardmarket_price'] ?? null;

            if (! empty($cardData['card_sets'][0]['set_code'])) {
                $setCodeFull = $cardData['card_sets'][0]['set_code'];
                $setCode = explode('-', $setCodeFull)[0] ?? $setCodeFull;

                $set = Set::query()->firstOrCreate(
                    ['code' => $setCode],
                    ['name' => $cardData['card_sets'][0]['set_name'] ?? $setCode],
                );

                CardPrint::query()->firstOrCreate(
                    ['card_id' => $card->id, 'set_id' => $set->id, 'print_code' => $setCodeFull],
                    [
                        'rarity' => $cardData['card_sets'][0]['set_rarity'] ?? 'Common',
                        'price_cardmarket' => is_numeric($marketPrice) ? (float) $marketPrice : null,
                        'image_url' => $imageUrl,
                    ],
                );
            }

            return $card->id;
        });
    }

    private function ensureOwner(Deck $deck, string $userId): void
    {
        abort_if($deck->user_id !== $userId, 403, 'No puedes acceder a un deck que no te pertenece.');
    }

    private function loadDeckWithCosts(Deck $deck): array
    {
        $deck->load(['versions.cards.card']);

        return [
            'id' => $deck->id,
            'user_id' => $deck->user_id,
            'name' => $deck->name,
            'description' => $deck->description,
            'created_at' => $deck->created_at,
            'updated_at' => $deck->updated_at,
            'versions' => $deck->versions->map(fn (DeckVersion $version): array => $this->formatVersion($version))->values(),
        ];
    }

    private function formatVersion(DeckVersion $version): array
    {
        $version->loadMissing(['cards.card']);

        $totalCost = 0.0;
        $sectionCounts = ['main' => 0, 'extra' => 0, 'side' => 0];

        $cards = $version->cards->map(function ($deckCard) use (&$totalCost, &$sectionCounts): array {
            $unitPrice = (float) (CardPrint::query()
                ->where('card_id', $deckCard->card_id)
                ->selectRaw('MIN(COALESCE(price_cardmarket, 0)) as min_price')
                ->value('min_price') ?? 0);

            $lineTotal = $unitPrice * (int) $deckCard->quantity;
            $totalCost += $lineTotal;

            if (isset($sectionCounts[$deckCard->section])) {
                $sectionCounts[$deckCard->section] += (int) $deckCard->quantity;
            }

            return [
                'id' => $deckCard->id,
                'card_id' => $deckCard->card_id,
                'card_name' => $deckCard->card?->name,
                'quantity' => $deckCard->quantity,
                'section' => $deckCard->section,
                'estimated_unit_price' => round($unitPrice, 2),
                'estimated_line_total' => round($lineTotal, 2),
            ];
        })->values();

        return [
            'id' => $version->id,
            'deck_id' => $version->deck_id,
            'version_name' => $version->version_name,
            'cards' => $cards,
            'summary' => [
                'main_count' => $sectionCounts['main'],
                'extra_count' => $sectionCounts['extra'],
                'side_count' => $sectionCounts['side'],
                'total_cards' => array_sum($sectionCounts),
                'estimated_total_cost' => round($totalCost, 2),
            ],
            'created_at' => $version->created_at,
            'updated_at' => $version->updated_at,
        ];
    }
}