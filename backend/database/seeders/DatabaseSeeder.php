<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\CardPrint;
use App\Models\Set;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate([
            'email' => 'test@example.com',
        ], [
            'name' => 'Test User',
            'password' => bcrypt('password'),
        ]);

        $fakeCard = Card::query()->where('name', 'Kewl Dragon')->first();
        if ($fakeCard) {
            CardPrint::query()->where('card_id', $fakeCard->id)->delete();
            $fakeCard->delete();
        }

        $legendarySet = Set::firstOrCreate(
            ['code' => 'LOB'],
            ['name' => 'Legend of Blue Eyes White Dragon'],
        );

        $starterSet = Set::firstOrCreate(
            ['code' => 'SDK'],
            ['name' => 'Starter Deck Kaiba'],
        );

        $cards = [
            [
                'name' => 'Blue-Eyes White Dragon',
                'type' => 'Normal Monster',
                'attribute' => 'LIGHT',
                'race' => 'Dragon',
                'level' => 8,
                'atk' => 3000,
                'def' => 2500,
                'archetype' => 'Blue-Eyes',
                'set_id' => $legendarySet->id,
                'print_code' => 'LOB-001',
                'rarity' => 'Ultra Rare',
                'price_cardmarket' => 5.5,
                'image_url' => 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
            ],
            [
                'name' => 'Dark Magician',
                'type' => 'Normal Monster',
                'attribute' => 'DARK',
                'race' => 'Spellcaster',
                'level' => 7,
                'atk' => 2500,
                'def' => 2100,
                'archetype' => 'Dark Magician',
                'set_id' => $starterSet->id,
                'print_code' => 'SDK-001',
                'rarity' => 'Super Rare',
                'price_cardmarket' => 4.25,
                'image_url' => 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
            ],
            [
                'name' => 'Lord of D.',
                'type' => 'Effect Monster',
                'attribute' => 'DARK',
                'race' => 'Spellcaster',
                'level' => 4,
                'atk' => 1200,
                'def' => 1100,
                'archetype' => null,
                'set_id' => $starterSet->id,
                'print_code' => 'SDK-002',
                'rarity' => 'Common',
                'price_cardmarket' => 1.75,
                'image_url' => 'https://images.ygoprodeck.com/images/cards/17985575.jpg',
            ],
        ];

        foreach ($cards as $cardData) {
            $card = Card::firstOrCreate(
                ['name' => $cardData['name']],
                [
                    'type' => $cardData['type'],
                    'attribute' => $cardData['attribute'],
                    'race' => $cardData['race'],
                    'level' => $cardData['level'],
                    'atk' => $cardData['atk'],
                    'def' => $cardData['def'],
                    'archetype' => $cardData['archetype'],
                ],
            );

            CardPrint::firstOrCreate(
                ['card_id' => $card->id, 'set_id' => $cardData['set_id'], 'print_code' => $cardData['print_code']],
                [
                    'rarity' => $cardData['rarity'],
                    'price_cardmarket' => $cardData['price_cardmarket'],
                    'image_url' => $cardData['image_url'],
                ],
            );
        }
    }
}
