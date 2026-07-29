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
        Schema::create('deck_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('deck_version_id')->constrained()->cascadeOnDelete();
            
            // Decks are built using general cards (not specific printing, though users could bind printing if desired, the domain says catalog cards)
            $table->foreignUuid('card_id')->constrained()->cascadeOnDelete();
            
            $table->integer('quantity')->default(1);
            $table->string('section'); // 'main', 'extra', 'side'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deck_cards');
    }
};
