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
        Schema::table('card_prints', function (Blueprint $table): void {
            $table->string('tcgplayer_product_id')->nullable()->index()->after('print_code');
            $table->decimal('tcgplayer_low_price', 10, 2)->nullable()->after('price_cardmarket');
            $table->decimal('tcgplayer_mid_price', 10, 2)->nullable()->after('tcgplayer_low_price');
            $table->decimal('tcgplayer_high_price', 10, 2)->nullable()->after('tcgplayer_mid_price');
            $table->decimal('tcgplayer_market_price', 10, 2)->nullable()->after('tcgplayer_high_price');
            $table->timestamp('tcgplayer_updated_at')->nullable()->after('tcgplayer_market_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('card_prints', function (Blueprint $table): void {
            $table->dropColumn([
                'tcgplayer_product_id',
                'tcgplayer_low_price',
                'tcgplayer_mid_price',
                'tcgplayer_high_price',
                'tcgplayer_market_price',
                'tcgplayer_updated_at',
            ]);
        });
    }
};
