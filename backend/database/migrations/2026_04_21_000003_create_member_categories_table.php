<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dahira_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('label', 100);
            $table->decimal('weekly_amount', 10, 2)->default(0);
            $table->string('color', 20)->default('#6b7280');
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['dahira_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_categories');
    }
};
