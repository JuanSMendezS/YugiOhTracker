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
        Schema::create('collection_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('card_print_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            
            // Item attributes
            $table->string('condition')->nullable(); // 'Near Mint', 'Lightly Played', etc.
            $table->string('language')->nullable();  // 'EN', 'ES', etc.
            $table->boolean('is_foil')->default(false);
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_items');
    }
};
