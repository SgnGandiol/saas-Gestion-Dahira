<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer les colonnes famille sur members
        Schema::table('members', function (Blueprint $table) {
            $table->dropForeign(['family_id']);
            $table->dropColumn(['family_id', 'is_family_head']);
        });

        // Supprimer family_id sur houses, ajouter stats
        Schema::table('houses', function (Blueprint $table) {
            $table->dropForeign(['family_id']);
            $table->dropColumn('family_id');
            $table->unsignedInteger('total_received')->default(0)->after('min_interval_weeks');
            $table->date('last_received_at')->nullable()->after('total_received');
        });

        // Supprimer la table families
        Schema::dropIfExists('families');
    }

    public function down(): void
    {
        Schema::table('houses', function (Blueprint $table) {
            $table->dropColumn(['total_received', 'last_received_at']);
            $table->foreignId('family_id')->nullable()->constrained()->cascadeOnDelete();
        });

        Schema::create('families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dahira_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('neighborhood')->nullable();
            $table->string('phone')->nullable();
            $table->unsignedInteger('capacity')->default(30);
            $table->boolean('is_available')->default(true);
            $table->unsignedInteger('total_received')->default(0);
            $table->date('last_received_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('members', function (Blueprint $table) {
            $table->foreignId('family_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_family_head')->default(false);
        });
    }
};
