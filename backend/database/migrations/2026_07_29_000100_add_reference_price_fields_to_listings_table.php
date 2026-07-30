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
        Schema::table('listings', function (Blueprint $table): void {
            $table->decimal('base_reference_price', 10, 2)->nullable()->after('currency');
            $table->string('base_reference_source')->nullable()->after('base_reference_price');
            $table->string('base_reference_currency', 3)->nullable()->after('base_reference_source');
            $table->timestamp('base_reference_updated_at')->nullable()->after('base_reference_currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table): void {
            $table->dropColumn([
                'base_reference_price',
                'base_reference_source',
                'base_reference_currency',
                'base_reference_updated_at',
            ]);
        });
    }
};
