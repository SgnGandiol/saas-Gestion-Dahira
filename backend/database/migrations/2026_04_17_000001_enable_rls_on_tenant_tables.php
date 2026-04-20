<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * PostgreSQL Row-Level Security — defense-in-depth layer.
 * Only runs on PostgreSQL; skipped silently on other drivers (SQLite, etc.).
 *
 * Policy: a row is accessible only when the session variable
 * app.current_dahira_id is set AND matches the row's dahira_id.
 * This forces explicit tenant context — no fallback "allow all".
 */
return new class extends Migration
{
    private array $tables = [
        'members',
        'families',
        'houses',
        'rotations',
        'contributions',
        'expenses',
        'assignments',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->tables as $table) {
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table}");

            // Strict: the variable MUST be set and MUST match — no fallback
            DB::statement("
                CREATE POLICY tenant_isolation ON {$table}
                USING (
                    NULLIF(current_setting('app.current_dahira_id', true), '') IS NOT NULL
                    AND dahira_id = NULLIF(current_setting('app.current_dahira_id', true), '')::bigint
                )
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->tables as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table}");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        }
    }
};
