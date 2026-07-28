<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('card_prints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('card_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('set_id')->constrained()->cascadeOnDelete();
            $table->string('rarity');
            $table->string('rarity_code')->nullable();
            $table->string('print_code')->index(); // e.g. 'RA02-EN006'
            
            // Reference prices (from API sync)
            $table->decimal('price_tcgplayer', 10, 2)->nullable();
            $table->decimal('price_cardmarket', 10, 2)->nullable();
            
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_prints');
    }
};
