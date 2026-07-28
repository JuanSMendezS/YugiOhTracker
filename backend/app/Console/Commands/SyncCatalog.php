<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Card;
use App\Models\Set;
use App\Models\CardPrint;

class SyncCatalog extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-catalog {--limit= : Limit the number of cards to sync for testing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Yu-Gi-Oh! cards catalog from YGOPRODeck API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Fetching card data from YGOPRODeck API...");
        
        // Fetch all cards from the API with a 60 seconds timeout
        $response = Http::timeout(60)->get('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        
        if ($response->failed()) {
            $this->error("Failed to fetch data from YGOPRODeck API.");
            return 1;
        }
        
        $data = $response->json()['data'] ?? [];
        $totalCards = count($data);
        $this->info("Found {$totalCards} cards in the API.");
        
        $limit = $this->option('limit');
        if ($limit) {
            $data = array_slice($data, 0, (int)$limit);
            $this->info("Limiting sync to {$limit} cards for testing.");
        }
        
        $this->info("Caching existing records to memory for high-performance import...");
        $existingCards = Card::pluck('id', 'name')->toArray();
        $existingSets = Set::pluck('id', 'code')->toArray();
        $existingPrints = CardPrint::pluck('id', 'print_code')->toArray();
        
        $newCards = [];
        $newSets = [];
        $newPrints = [];
        $updatedPrints = [];
        
        $this->info("Processing data...");
        
        $bar = $this->output->createProgressBar(count($data));
        $bar->start();
        
        foreach ($data as $cardData) {
            $cardName = $cardData['name'];
            
            // 1. Get or prepare Card
            if (isset($existingCards[$cardName])) {
                $cardId = $existingCards[$cardName];
            } else {
                $cardId = (string) Str::uuid();
                $newCards[] = [
                    'id' => $cardId,
                    'name' => $cardName,
                    'type' => $cardData['type'] ?? null,
                    'frame_type' => $cardData['frameType'] ?? null,
                    'description' => $cardData['desc'] ?? null,
                    'atk' => isset($cardData['atk']) ? (int)$cardData['atk'] : null,
                    'def' => isset($cardData['def']) ? (int)$cardData['def'] : null,
                    'level' => isset($cardData['level']) ? (int)$cardData['level'] : null,
                    'race' => $cardData['race'] ?? null,
                    'attribute' => $cardData['attribute'] ?? null,
                    'archetype' => $cardData['archetype'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $existingCards[$cardName] = $cardId;
            }
            
            // 2. Handle Sets & Prints
            if (isset($cardData['card_sets'])) {
                foreach ($cardData['card_sets'] as $setData) {
                    $setCodeFull = $setData['set_code'] ?? null;
                    if (!$setCodeFull) {
                        continue;
                    }
                    
                    // Extract code prefix (e.g., "RA02" from "RA02-EN006")
                    $codeParts = explode('-', $setCodeFull);
                    $setCode = $codeParts[0];
                    
                    // Get or prepare Set
                    if (isset($existingSets[$setCode])) {
                        $setId = $existingSets[$setCode];
                    } else {
                        $setId = (string) Str::uuid();
                        $newSets[] = [
                            'id' => $setId,
                            'code' => $setCode,
                            'name' => $setData['set_name'] ?? $setCode,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $existingSets[$setCode] = $setId;
                    }
                    
                    // Card Print details
                    $printCode = $setCodeFull;
                    $imageUrl = null;
                    if (isset($cardData['card_images'][0]['image_url'])) {
                        $imageUrl = $cardData['card_images'][0]['image_url'];
                    }
                    
                    $priceTcg = isset($setData['set_price']) && is_numeric($setData['set_price']) ? (float)$setData['set_price'] : 0.00;
                    
                    // Fallback to general card prices if set price is 0
                    if ($priceTcg == 0.00 && isset($cardData['card_prices'][0]['tcgplayer_price'])) {
                        $priceTcg = (float)$cardData['card_prices'][0]['tcgplayer_price'];
                    }
                    
                    $priceCm = 0.00;
                    if (isset($cardData['card_prices'][0]['cardmarket_price'])) {
                        $priceCm = (float)$cardData['card_prices'][0]['cardmarket_price'];
                    }
                    
                    if (isset($existingPrints[$printCode])) {
                        $updatedPrints[] = [
                            'id' => $existingPrints[$printCode],
                            'price_tcgplayer' => $priceTcg,
                            'price_cardmarket' => $priceCm,
                            'image_url' => $imageUrl,
                            'updated_at' => now(),
                        ];
                    } else {
                        $printId = (string) Str::uuid();
                        $newPrints[] = [
                            'id' => $printId,
                            'card_id' => $cardId,
                            'set_id' => $setId,
                            'rarity' => $setData['set_rarity'] ?? 'Common',
                            'rarity_code' => $setData['set_rarity_code'] ?? null,
                            'print_code' => $printCode,
                            'price_tcgplayer' => $priceTcg,
                            'price_cardmarket' => $priceCm,
                            'image_url' => $imageUrl,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $existingPrints[$printCode] = $printId;
                    }
                }
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        
        // 3. Database inserts/updates in chunks
        if (count($newSets) > 0) {
            $this->info("Writing " . count($newSets) . " new Sets to database...");
            foreach (array_chunk($newSets, 100) as $chunk) {
                DB::table('sets')->insert($chunk);
            }
        }
        
        if (count($newCards) > 0) {
            $this->info("Writing " . count($newCards) . " new Cards to database...");
            foreach (array_chunk($newCards, 100) as $chunk) {
                DB::table('cards')->insert($chunk);
            }
        }
        
        if (count($newPrints) > 0) {
            $this->info("Writing " . count($newPrints) . " new Card Prints to database...");
            foreach (array_chunk($newPrints, 100) as $chunk) {
                DB::table('card_prints')->insert($chunk);
            }
        }
        
        if (count($updatedPrints) > 0) {
            $this->info("Updating " . count($updatedPrints) . " Card Prints prices...");
            foreach (array_chunk($updatedPrints, 100) as $chunk) {
                foreach ($chunk as $print) {
                    DB::table('card_prints')
                        ->where('id', $print['id'])
                        ->update([
                            'price_tcgplayer' => $print['price_tcgplayer'],
                            'price_cardmarket' => $print['price_cardmarket'],
                            'image_url' => $print['image_url'],
                            'updated_at' => $print['updated_at'],
                        ]);
                }
            }
        }
        
        $this->info("Sync completed successfully!");
        $this->info("Stats -> Inserted: " . count($newCards) . " Cards, " . count($newSets) . " Sets, " . count($newPrints) . " Prints.");
        $this->info("Stats -> Updated: " . count($updatedPrints) . " Prints.");
        
        return 0;
    }
}
