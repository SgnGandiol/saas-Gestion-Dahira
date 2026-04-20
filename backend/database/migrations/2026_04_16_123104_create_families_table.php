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
        Schema::create('families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dahira_id')->constrained()->cascadeOnDelete();
            $table->string('name');                         // nom du foyer / chef de famille
            $table->string('address')->nullable();
            $table->string('neighborhood')->nullable();     // quartier
            $table->string('phone')->nullable();
            $table->integer('capacity')->default(20);       // capacité d'accueil (personnes)
            $table->boolean('is_available')->default(true); // disponible pour recevoir
            $table->integer('total_received')->default(0);  // compteur passages reçus
            $table->date('last_received_at')->nullable();   // date dernier passage
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('families');
    }
};
