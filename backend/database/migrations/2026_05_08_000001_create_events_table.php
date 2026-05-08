<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dahira_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['thiant', 'ziar', 'gamou', 'social', 'autre'])->default('autre');
            $table->decimal('target_amount', 12, 2)->nullable();
            $table->date('deadline')->nullable();
            $table->string('color', 20)->default('#8b5cf6');
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
