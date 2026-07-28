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
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // 'duelista' or 'tienda'
            $table->string('display_name');
            $table->string('avatar_url')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->json('social_links')->nullable();
            $table->integer('reputation')->default(100);
            
            // Store specific fields
            $table->text('store_description')->nullable();
            $table->string('store_banner_url')->nullable();
            $table->string('store_logo_url')->nullable();
            $table->string('store_schedule')->nullable();
            $table->string('store_contact')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
