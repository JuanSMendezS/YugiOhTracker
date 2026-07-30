<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardPrint;
use App\Models\Set;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_cards_endpoint_supports_search_and_set_filter(): void
    {
        $setRa = Set::create([
            'code' => 'RA02',
            'name' => '25th Anniversary Rarity Collection II',
        ]);

        $setIn = Set::create([
            'code' => 'INFO',
            'name' => 'Infinite Forbidden',
        ]);

        $blueEyes = Card::create([
            'name' => 'Blue-Eyes White Dragon',
            'type' => 'Normal Monster',
            'attribute' => 'LIGHT',
            'race' => 'Dragon',
            'level' => 8,
            'atk' => 3000,
            'def' => 2500,
            'archetype' => 'Blue-Eyes',
        ]);

        $darkMagician = Card::create([
            'name' => 'Dark Magician',
            'type' => 'Normal Monster',
            'attribute' => 'DARK',
            'race' => 'Spellcaster',
            'level' => 7,
            'atk' => 2500,
            'def' => 2100,
            'archetype' => 'Dark Magician',
        ]);

        CardPrint::create([
            'card_id' => $blueEyes->id,
            'set_id' => $setRa->id,
            'rarity' => 'Ultra Rare',
            'print_code' => 'RA02-EN001',
            'price_cardmarket' => 5.00,
        ]);

        CardPrint::create([
            'card_id' => $darkMagician->id,
            'set_id' => $setIn->id,
            'rarity' => 'Secret Rare',
            'print_code' => 'INFO-EN001',
            'price_cardmarket' => 6.50,
        ]);

        $response = $this->getJson('/api/cards?q=Blue&set_code=RA02');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Blue-Eyes White Dragon');
    }

    public function test_sets_endpoint_supports_card_name_filter(): void
    {
        $set = Set::create([
            'code' => 'LOB',
            'name' => 'Legend of Blue Eyes White Dragon',
        ]);

        $card = Card::create([
            'name' => 'Exodia the Forbidden One',
        ]);

        CardPrint::create([
            'card_id' => $card->id,
            'set_id' => $set->id,
            'rarity' => 'Ultra Rare',
            'print_code' => 'LOB-124',
        ]);

        $response = $this->getJson('/api/sets?card_name=Exodia');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'LOB');
    }

    public function test_catalog_status_endpoint_reports_ready_state(): void
    {
        $set = Set::create([
            'code' => 'LOB',
            'name' => 'Legend of Blue Eyes White Dragon',
        ]);

        $card = Card::create([
            'name' => 'Exodia the Forbidden One',
        ]);

        CardPrint::create([
            'card_id' => $card->id,
            'set_id' => $set->id,
            'rarity' => 'Ultra Rare',
            'print_code' => 'LOB-124',
        ]);

        $this->getJson('/api/catalog/status')
            ->assertOk()
            ->assertJsonPath('cards_count', 1)
            ->assertJsonPath('sets_count', 1)
            ->assertJsonPath('card_prints_count', 1)
            ->assertJsonPath('is_catalog_ready', true);
    }
}