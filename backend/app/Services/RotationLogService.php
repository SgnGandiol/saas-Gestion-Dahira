<?php

namespace App\Services;

use App\Models\Rotation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RotationLogService
{
    /**
     * Persists a change event to rotation_logs.
     *
     * @param array $meta  Free-form context (old_status, new_status, reason, …)
     */
    public function logChange(Rotation $rotation, string $action, array $meta = []): void
    {
        DB::table('rotation_logs')->insert([
            'rotation_id' => $rotation->id,
            'dahira_id'   => $rotation->dahira_id,
            'action'      => $action,
            'meta'        => json_encode($meta),
            'created_by'  => Auth::id(),
            'created_at'  => now(),
        ]);
    }

    /**
     * Returns the full chronological history for a rotation.
     *
     * Each entry includes action, meta (decoded), creator name, and timestamp.
     */
    public function getHistory(int $rotationId): Collection
    {
        return DB::table('rotation_logs as rl')
            ->leftJoin('users as u', 'u.id', '=', 'rl.created_by')
            ->where('rl.rotation_id', $rotationId)
            ->orderBy('rl.created_at')
            ->select(
                'rl.id',
                'rl.action',
                'rl.meta',
                'rl.created_at',
                DB::raw("COALESCE(u.name, 'Système') AS created_by_name")
            )
            ->get()
            ->map(function ($row) {
                return [
                    'id'              => $row->id,
                    'action'          => $row->action,
                    'meta'            => json_decode($row->meta ?? '{}', true),
                    'created_at'      => $row->created_at,
                    'created_by_name' => $row->created_by_name,
                ];
            });
    }
}
