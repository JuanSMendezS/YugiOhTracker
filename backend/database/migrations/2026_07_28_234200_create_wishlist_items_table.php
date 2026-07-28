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
        Schema::create('wishlist_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wishlist_id')->constrained()->cascadeOnDelete();
            
            // Wishlists target a generic card (not a specific printing code)
            $table->foreignUuid('card_id')->constrained()->cascadeOnDelete();
            
            $table->string('priority')->default('media'); // 'alta', 'media', 'baja'
            $table->decimal('target_price', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlist_items');
    }
};
