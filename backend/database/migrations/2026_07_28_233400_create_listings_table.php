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
        Schema::create('listings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            
            // card_print_id can be null if listing is a complex asset (like a 'base' or 'sealed product' with no single print ID)
            $table->foreignUuid('card_print_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('asset_type'); // 'carta_individual', 'playset', 'base', 'producto_sellado'
            $table->string('title')->nullable(); // useful for bases or sealed products (e.g. "Base Sky Striker")
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('COP'); // COP, USD
            $table->integer('quantity')->default(1);
            $table->string('status')->default('disponible'); // 'disponible', 'reservado', 'vendido', 'pausado'
            
            // Single card attributes
            $table->string('condition')->nullable(); // 'Near Mint', 'Lightly Played', etc.
            $table->string('language')->nullable();  // 'EN', 'ES', etc.
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
