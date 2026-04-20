<?php

namespace App\Services;

use App\Models\Dahira;
use Illuminate\Support\Facades\DB;

class TenantManager
{
    private ?Dahira $current = null;

    public function set(Dahira $dahira): void
    {
        $this->current = $dahira;

        // Set PostgreSQL session variable for RLS — wrapped in try/catch
        // because SQLite (used in tests) does not support this statement.
        try {
            DB::statement('SET LOCAL "app.current_dahira_id" = ?', [$dahira->id]);
        } catch (\Exception) {
            // Non-PostgreSQL driver — RLS handled at application level via TenantScope
        }
    }

    public function get(): ?Dahira
    {
        return $this->current;
    }

    public function id(): ?int
    {
        return $this->current?->id;
    }

    public function clear(): void
    {
        $this->current = null;
    }

    public function resolved(): bool
    {
        return $this->current !== null;
    }
}
