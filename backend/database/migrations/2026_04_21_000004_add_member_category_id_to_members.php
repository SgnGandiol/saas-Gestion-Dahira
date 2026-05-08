<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->foreignId('member_category_id')
                ->nullable()
                ->after('house_id')
                ->constrained('member_categories')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\MemberCategory::class);
            $table->dropColumn('member_category_id');
        });
    }
};
