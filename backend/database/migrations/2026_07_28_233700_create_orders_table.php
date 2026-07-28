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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Foreign keys referencing users
            $table->uuid('buyer_id');
            $table->uuid('seller_id');
            
            $table->foreign('buyer_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('seller_id')->references('id')->on('users')->cascadeOnDelete();
            
            // Order details
            $table->string('status')->default('pendiente'); // 'pendiente', 'pagado_reportado', 'pagado_confirmado', 'enviado', 'entregado', 'cancelado'
            $table->decimal('total', 10, 2);
            $table->string('currency', 3)->default('COP');
            
            // Payment tracking (Fictional/Informational for MVP)
            $table->string('payment_status')->default('pendiente'); // 'pendiente', 'reportado', 'confirmado', 'rechazado'
            $table->string('payment_receipt_path')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
