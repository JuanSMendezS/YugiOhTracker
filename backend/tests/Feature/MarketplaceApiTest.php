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

class MarketplaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_user_can_create_update_and_delete_listing(): void
    {
        $storeUser = User::factory()->create();
        Profile::create([
            'user_id' => $storeUser->id,
            'type' => 'tienda',
            'display_name' => 'Kaiba Corp Cards',
        ]);

        $set = Set::create([
            'code' => 'SDK',
            'name' => 'Starter Deck Kaiba',
        ]);

        $card = Card::create([
            'name' => 'Blue-Eyes White Dragon',
        ]);

        $print = CardPrint::create([
            'card_id' => $card->id,
            'set_id' => $set->id,
            'rarity' => 'Ultra Rare',
            'print_code' => 'SDK-001',
        ]);

        Sanctum::actingAs($storeUser);

        $created = $this->postJson('/api/listings', [
            'card_print_id' => $print->id,
            'asset_type' => 'carta_individual',
            'title' => 'Blue-Eyes NM',
            'description' => 'Carta en excelente estado',
            'price' => 95000,
            'currency' => 'cop',
            'quantity' => 2,
            'status' => 'disponible',
            'condition' => 'Near Mint',
            'language' => 'ES',
            'images' => ['listings/sdk-001-front.jpg'],
        ]);

        $created
            ->assertCreated()
            ->assertJsonPath('title', 'Blue-Eyes NM')
            ->assertJsonPath('currency', 'COP')
            ->assertJsonPath('user.profile.type', 'tienda');

        $listingId = $created->json('id');

        $this->assertDatabaseHas('listings', [
            'id' => $listingId,
            'user_id' => $storeUser->id,
            'title' => 'Blue-Eyes NM',
            'currency' => 'COP',
        ]);

        $updated = $this->putJson("/api/listings/{$listingId}", [
            'price' => 90000,
            'status' => 'reservado',
            'quantity' => 1,
            'images' => ['listings/sdk-001-new.jpg'],
        ]);

        $updated
            ->assertOk()
            ->assertJsonPath('price', 90000)
            ->assertJsonPath('status', 'reservado')
            ->assertJsonPath('quantity', 1)
            ->assertJsonPath('images.0.image_path', 'listings/sdk-001-new.jpg');

        $this->deleteJson("/api/listings/{$listingId}")
            ->assertOk()
            ->assertJsonPath('message', 'Publicacion eliminada');

        $this->assertDatabaseMissing('listings', ['id' => $listingId]);
    }

    public function test_non_store_user_cannot_create_listing(): void
    {
        $duelist = User::factory()->create();
        Profile::create([
            'user_id' => $duelist->id,
            'type' => 'duelista',
            'display_name' => 'Yugi',
        ]);

        Sanctum::actingAs($duelist);

        $this->postJson('/api/listings', [
            'asset_type' => 'base',
            'title' => 'Base de prueba',
            'price' => 120000,
        ])->assertForbidden();
    }

    public function test_owner_guard_prevents_other_user_updates(): void
    {
        $owner = User::factory()->create();
        Profile::create([
            'user_id' => $owner->id,
            'type' => 'tienda',
            'display_name' => 'Owner Store',
        ]);

        $other = User::factory()->create();
        Profile::create([
            'user_id' => $other->id,
            'type' => 'tienda',
            'display_name' => 'Other Store',
        ]);

        $listing = Listing::create([
            'user_id' => $owner->id,
            'asset_type' => 'base',
            'title' => 'Base XYZ',
            'price' => 100000,
            'currency' => 'COP',
            'quantity' => 1,
            'status' => 'disponible',
        ]);

        Sanctum::actingAs($other);

        $this->putJson("/api/listings/{$listing->id}", [
            'price' => 50000,
        ])->assertForbidden();
    }

    public function test_store_inventory_returns_only_authenticated_store_listings(): void
    {
        $storeUser = User::factory()->create();
        Profile::create([
            'user_id' => $storeUser->id,
            'type' => 'tienda',
            'display_name' => 'Main Store',
        ]);

        $otherStore = User::factory()->create();
        Profile::create([
            'user_id' => $otherStore->id,
            'type' => 'tienda',
            'display_name' => 'Other Store',
        ]);

        Listing::create([
            'user_id' => $storeUser->id,
            'asset_type' => 'base',
            'title' => 'Inventario propio',
            'price' => 1000,
            'currency' => 'COP',
            'quantity' => 3,
            'status' => 'disponible',
        ]);

        Listing::create([
            'user_id' => $otherStore->id,
            'asset_type' => 'base',
            'title' => 'Inventario ajeno',
            'price' => 2000,
            'currency' => 'COP',
            'quantity' => 5,
            'status' => 'disponible',
        ]);

        Sanctum::actingAs($storeUser);

        $response = $this->getJson('/api/inventory/store');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Inventario propio');
    }
}