<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardPrint;
use App\Models\Listing;
use App\Models\Profile;
use App\Models\Set;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class Phase6ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_collection_crud_flow(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $set = Set::create(['code' => 'LOB', 'name' => 'Legend of Blue Eyes']);
        $card = Card::create(['name' => 'Dark Magician']);
        $print = CardPrint::create([
            'card_id' => $card->id,
            'set_id' => $set->id,
            'rarity' => 'Ultra Rare',
            'print_code' => 'LOB-005',
            'price_cardmarket' => 4.25,
        ]);

        $created = $this->postJson('/api/collection/items', [
            'card_print_id' => $print->id,
            'quantity' => 2,
            'condition' => 'Near Mint',
            'language' => 'EN',
            'is_foil' => false,
        ]);

        $created->assertCreated()->assertJsonPath('quantity', 2);

        $itemId = $created->json('id');

        $this->putJson("/api/collection/items/{$itemId}", [
            'quantity' => 3,
            'notes' => 'Actualizado',
        ])->assertOk()->assertJsonPath('quantity', 3);

        $this->getJson('/api/collection/items')
            ->assertOk()
            ->assertJsonPath('summary.total_cards', 3)
            ->assertJsonPath('summary.estimated_value', 12.75);

        $this->deleteJson("/api/collection/items/{$itemId}")
            ->assertOk()
            ->assertJsonPath('message', 'Item eliminado de la coleccion');
    }

    public function test_wishlist_crud_flow(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $card = Card::create([
            'name' => 'Blue-Eyes White Dragon',
            'archetype' => 'Blue-Eyes',
        ]);

        $created = $this->postJson('/api/wishlist/items', [
            'card_id' => $card->id,
            'priority' => 'alta',
            'target_price' => 20000,
        ]);

        $created->assertCreated()->assertJsonPath('priority', 'alta');
        $itemId = $created->json('id');

        $this->putJson("/api/wishlist/items/{$itemId}", [
            'priority' => 'media',
            'notes' => 'Esperar mejor precio',
        ])->assertOk()->assertJsonPath('priority', 'media');

        $this->getJson('/api/wishlist/items')
            ->assertOk()
            ->assertJsonPath('items.0.card.name', 'Blue-Eyes White Dragon');

        $this->deleteJson("/api/wishlist/items/{$itemId}")
            ->assertOk()
            ->assertJsonPath('message', 'Item eliminado de la wishlist');
    }

    public function test_deck_versioning_and_cost_calculation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $set = Set::create(['code' => 'SDK', 'name' => 'Starter Deck Kaiba']);
        $blueEyes = Card::create(['name' => 'Blue-Eyes White Dragon']);
        $lordD = Card::create(['name' => 'Lord of D.']);

        CardPrint::create([
            'card_id' => $blueEyes->id,
            'set_id' => $set->id,
            'rarity' => 'Ultra Rare',
            'print_code' => 'SDK-001',
            'price_cardmarket' => 3.00,
        ]);

        CardPrint::create([
            'card_id' => $lordD->id,
            'set_id' => $set->id,
            'rarity' => 'Super Rare',
            'print_code' => 'SDK-002',
            'price_cardmarket' => 1.50,
        ]);

        $deck = $this->postJson('/api/decks', [
            'name' => 'Dragon Beat',
            'initial_version_name' => 'V1',
            'cards' => [
                ['card_id' => $blueEyes->id, 'quantity' => 2, 'section' => 'main'],
                ['card_id' => $lordD->id, 'quantity' => 1, 'section' => 'main'],
            ],
        ])->assertCreated();

        $deckId = $deck->json('id');
        $versionId = $deck->json('versions.0.id');

        $this->getJson("/api/decks/{$deckId}/versions/{$versionId}")
            ->assertOk()
            ->assertJsonPath('summary.total_cards', 3)
            ->assertJsonPath('summary.estimated_total_cost', 7.5);

        $this->postJson("/api/decks/{$deckId}/versions", [
            'version_name' => 'V2',
            'copy_from_version_id' => $versionId,
        ])->assertCreated()->assertJsonPath('summary.total_cards', 3);
    }

    public function test_checkout_reserves_listings_and_creates_history(): void
    {
        $buyer = User::factory()->create();
        $seller = User::factory()->create();

        Profile::create([
            'user_id' => $seller->id,
            'type' => 'tienda',
            'display_name' => 'Seller Store',
        ]);

        $listing = Listing::create([
            'user_id' => $seller->id,
            'asset_type' => 'carta_individual',
            'title' => 'Blue-Eyes NM',
            'price' => 15000,
            'currency' => 'COP',
            'quantity' => 2,
            'status' => 'disponible',
        ]);

        Sanctum::actingAs($buyer);

        $this->postJson('/api/orders/checkout', [
            'items' => [
                ['listing_id' => $listing->id, 'quantity' => 2],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('orders.0.total', 30000)
            ->assertJsonPath('orders.0.items.0.quantity', 2);

        $listing->refresh();
        $this->assertSame(0, $listing->quantity);
        $this->assertSame('reservado', $listing->status);

        $this->getJson('/api/orders/history')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.total', 30000);
    }
}