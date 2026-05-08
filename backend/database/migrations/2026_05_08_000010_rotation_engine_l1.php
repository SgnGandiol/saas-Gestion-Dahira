<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // --- members : champs moteur de rotation ---
        Schema::table('members', function (Blueprint $table) {
            $table->enum('availability_status', ['available', 'unavailable', 'travel', 'sick', 'suspended'])
                  ->default('available')
                  ->after('is_active');
            $table->unsignedSmallInteger('absence_frequency')->default(0)->after('availability_status');
            $table->decimal('priority_score', 8, 4)->default(0)->after('absence_frequency');
        });

        // --- houses : siège ---
        Schema::table('houses', function (Blueprint $table) {
            $table->boolean('is_headquarters')->default(false)->after('is_available');
        });

        // --- rotations : statuts étendus ---
        DB::statement("ALTER TABLE rotations DROP CONSTRAINT IF EXISTS rotations_status_check");
        DB::statement("ALTER TABLE rotations ALTER COLUMN status TYPE VARCHAR(20)");
        // Migrer les anciens statuts vers les nouveaux équivalents
        DB::statement("UPDATE rotations SET status = 'completed' WHERE status = 'done'");
        DB::statement("ALTER TABLE rotations ADD CONSTRAINT rotations_status_check
            CHECK (status IN ('planned','confirmed','ongoing','completed','cancelled','rescheduled','headquarters'))");

        // --- rotation_logs ---
        Schema::create('rotation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dahira_id')->constrained()->cascadeOnDelete();
            $table->string('action', 60);          // ex: status_changed, rescheduled, swapped…
            $table->json('meta')->nullable();       // contexte libre
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        // --- rotation_rebuilds ---
        Schema::create('rotation_rebuilds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dahira_id')->constrained()->cascadeOnDelete();
            $table->string('trigger_reason', 120)->nullable();
            $table->enum('mode', ['balanced', 'stable', 'geographic', 'urgent'])->default('balanced');
            $table->json('preview')->nullable();    // snapshot du diff avant application
            $table->timestamp('started_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // --- rotation_rebuild_items ---
        Schema::create('rotation_rebuild_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rebuild_id')->constrained('rotation_rebuilds')->cascadeOnDelete();
            $table->foreignId('old_rotation_id')->nullable()->constrained('rotations')->nullOnDelete();
            $table->foreignId('new_rotation_id')->nullable()->constrained('rotations')->nullOnDelete();
            $table->foreignId('old_member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('new_member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->date('old_date')->nullable();
            $table->date('new_date')->nullable();
            $table->string('change_type', 40)->nullable(); // swap, postpone, headquarters, skip…
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rotation_rebuild_items');
        Schema::dropIfExists('rotation_rebuilds');
        Schema::dropIfExists('rotation_logs');

        DB::statement("ALTER TABLE rotations DROP CONSTRAINT IF EXISTS rotations_status_check");
        DB::statement("ALTER TABLE rotations ALTER COLUMN status TYPE VARCHAR(20)");
        DB::statement("ALTER TABLE rotations ADD CONSTRAINT rotations_status_check
            CHECK (status IN ('planned','confirmed','done','cancelled'))");

        Schema::table('houses', function (Blueprint $table) {
            $table->dropColumn('is_headquarters');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['availability_status', 'absence_frequency', 'priority_score']);
        });
    }
};
