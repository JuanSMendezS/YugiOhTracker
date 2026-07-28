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
        Schema::create('cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->index();
            $table->string('type')->nullable();
            $table->string('frame_type')->nullable();
            $table->text('description')->nullable();
            $table->integer('atk')->nullable();
            $table->integer('def')->nullable();
            $table->integer('level')->nullable(); // also represents rank or link rating
            $table->string('race')->nullable(); // monster type (e.g. Spellcaster) or Spell/Trap type
            $table->string('attribute')->nullable(); // (e.g. LIGHT, DARK)
            $table->string('archetype')->nullable(); // group identifier
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
