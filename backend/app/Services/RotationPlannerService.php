<?php

namespace App\Services;

use App\Models\House;
use App\Models\Member;
use App\Models\Rotation;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RotationPlannerService
{
    // Tours dans les 2 prochaines semaines = planning verrouillé
    private const LOCKED_DAYS = 14;

    public function __construct(
        private readonly RotationService    $rotationService,
        private readonly RotationLogService $logService,
    ) {}

    /**
     * Generates a preview of rebuilt rotations without persisting anything.
     *
     * Zones:
     *   locked   (<14 days)  → never touched
     *   flexible (≥14 days)  → recalculated
     *
     * @param string $mode  balanced|stable|geographic|urgent
     * @return array{locked: array, preview: array, meta: array}
     */
    public function previewRebuild(int $dahiraId, string $from, int $weeks, string $mode = 'balanced'): array
    {
        $fromDate  = Carbon::parse($from);
        $toDate    = $fromDate->copy()->addWeeks($weeks);
        $lockLimit = Carbon::today()->addDays(self::LOCKED_DAYS);

        // Existing rotations in the window
        $existing = Rotation::where('dahira_id', $dahiraId)
            ->whereBetween('scheduled_date', [$fromDate, $toDate])
            ->whereIn('status', ['planned', 'confirmed'])
            ->with(['member', 'house'])
            ->orderBy('scheduled_date')
            ->get();

        $locked   = $existing->filter(fn (Rotation $r) => Carbon::parse($r->scheduled_date)->lte($lockLimit));
        $flexible = $existing->filter(fn (Rotation $r) => Carbon::parse($r->scheduled_date)->gt($lockLimit));

        // Collect dates to rebuild
        $dates = $flexible->pluck('scheduled_date')->map(fn ($d) => Carbon::parse($d)->toDateString());

        // Generate new assignments for flexible dates
        $newAssignments = $this->generateAssignments($dahiraId, $dates->all(), $mode);

        // Build diff
        $diff = $flexible->values()->map(function (Rotation $old, int $i) use ($newAssignments) {
            $newSlot = $newAssignments[$i] ?? null;
            return [
                'rotation_id'    => $old->id,
                'date'           => $old->scheduled_date->toDateString(),
                'old_member_id'  => $old->member_id,
                'old_member_name'=> $old->member?->full_name,
                'old_house_id'   => $old->house_id,
                'old_house_label'=> $old->house?->label ?? $old->house?->address,
                'new_member_id'  => $newSlot['member_id'] ?? null,
                'new_member_name'=> $newSlot['member_name'] ?? null,
                'new_house_id'   => $newSlot['house_id'] ?? null,
                'new_house_label'=> $newSlot['house_label'] ?? null,
                'change_type'    => $this->changeType($old, $newSlot),
            ];
        });

        $changed = $diff->where('change_type', '!=', 'unchanged')->count();

        return [
            'locked'  => $locked->values()->map(fn (Rotation $r) => [
                'rotation_id' => $r->id,
                'date'        => $r->scheduled_date->toDateString(),
                'member_name' => $r->member?->full_name,
                'house_label' => $r->house?->label ?? $r->house?->address,
            ])->toArray(),
            'preview' => $diff->toArray(),
            'meta'    => [
                'mode'            => $mode,
                'from'            => $fromDate->toDateString(),
                'to'              => $toDate->toDateString(),
                'total_rotations' => $flexible->count(),
                'changed'         => $changed,
                'unchanged'       => $flexible->count() - $changed,
                'stability_pct'   => $flexible->count() > 0
                    ? round(($flexible->count() - $changed) / $flexible->count() * 100, 1)
                    : 100,
            ],
        ];
    }

    /**
     * Applies a previously generated preview to the database.
     * ALWAYS requires a previewRebuild() call first.
     *
     * @param array $preview  Output of previewRebuild()
     * @return Collection  The updated Rotation models
     */
    public function applyRebuild(array $preview): Collection
    {
        $diff = $preview['preview'] ?? [];
        if (empty($diff)) {
            return collect();
        }

        return DB::transaction(function () use ($preview, $diff) {
            // Persist rebuild record
            $rebuildId = DB::table('rotation_rebuilds')->insertGetId([
                'dahira_id'      => $this->inferDahiraId($diff),
                'mode'           => $preview['meta']['mode'] ?? 'balanced',
                'trigger_reason' => 'manual_rebuild',
                'preview'        => json_encode($preview),
                'started_at'     => now(),
                'applied_at'     => now(),
                'created_by'     => Auth::id(),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            $updated = collect();

            foreach ($diff as $slot) {
                if (($slot['change_type'] ?? 'unchanged') === 'unchanged') {
                    continue;
                }

                $rotation = Rotation::find($slot['rotation_id']);
                if (! $rotation) {
                    continue;
                }

                $oldMemberId = $rotation->member_id;
                $oldHouseId  = $rotation->house_id;

                $rotation->update([
                    'member_id' => $slot['new_member_id'],
                    'house_id'  => $slot['new_house_id'] ?? $rotation->house_id,
                    'status'    => 'planned',
                ]);

                // Log each change
                $rotation->refresh();
                $fake = clone $rotation;
                $fake->member_id = $oldMemberId;
                $fake->house_id  = $oldHouseId;

                $this->logService->logChange($rotation, 'rebuild_applied', [
                    'rebuild_id'    => $rebuildId,
                    'old_member_id' => $oldMemberId,
                    'new_member_id' => $slot['new_member_id'],
                    'change_type'   => $slot['change_type'],
                ]);

                // Persist rebuild item
                DB::table('rotation_rebuild_items')->insert([
                    'rebuild_id'       => $rebuildId,
                    'old_rotation_id'  => $rotation->id,
                    'new_rotation_id'  => $rotation->id,
                    'old_member_id'    => $oldMemberId,
                    'new_member_id'    => $slot['new_member_id'],
                    'old_date'         => $slot['date'],
                    'new_date'         => $slot['date'],
                    'change_type'      => $slot['change_type'],
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);

                $updated->push($rotation);
            }

            return $updated;
        });
    }

    /**
     * Cancels a rebuild, restoring the original member assignments.
     */
    public function cancelRebuild(int $rebuildId): bool
    {
        return DB::transaction(function () use ($rebuildId): bool {
            $rebuild = DB::table('rotation_rebuilds')->find($rebuildId);
            if (! $rebuild || $rebuild->cancelled_at) {
                return false;
            }

            $items = DB::table('rotation_rebuild_items')->where('rebuild_id', $rebuildId)->get();

            foreach ($items as $item) {
                $rotation = Rotation::find($item->new_rotation_id);
                if (! $rotation) {
                    continue;
                }

                $rotation->update([
                    'member_id' => $item->old_member_id,
                    'house_id'  => $rotation->house_id,
                ]);

                $this->logService->logChange($rotation, 'rebuild_cancelled', [
                    'rebuild_id'    => $rebuildId,
                    'restored_member_id' => $item->old_member_id,
                ]);
            }

            DB::table('rotation_rebuilds')
                ->where('id', $rebuildId)
                ->update(['cancelled_at' => now()]);

            return true;
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Generates new member assignments for a list of dates using the rotation engine.
     */
    private function generateAssignments(int $dahiraId, array $dates, string $mode): array
    {
        // Load all eligible members once
        $members = Member::where('dahira_id', $dahiraId)
            ->where('is_active', true)
            ->where('availability_status', '!=', 'suspended')
            ->with('house')
            ->get();

        if ($members->isEmpty()) {
            return [];
        }

        // Load rotation stats for all members
        $stats = Rotation::where('dahira_id', $dahiraId)
            ->whereIn('status', ['planned', 'confirmed', 'completed', 'ongoing', 'headquarters'])
            ->whereIn('member_id', $members->pluck('id'))
            ->selectRaw('member_id, COUNT(*) as cnt, MAX(scheduled_date) as last_date')
            ->groupBy('member_id')
            ->get()
            ->keyBy('member_id');

        $maxDays = $members->map(function (Member $m) use ($stats) {
            $row = $stats->get($m->id);
            return $row?->last_date
                ? Carbon::parse($row->last_date)->diffInDays(now())
                : 365;
        })->max() ?: 1;

        $assignments = [];
        // Track in-session rotation counts to preserve equité across the preview
        $sessionCounts = $members->pluck('id')->flip()->map(fn () => 0)->toArray();

        foreach ($dates as $date) {
            // Ajuster stats avec les tours de la session courante
            $sessionStats = $stats->map(function ($row, $memberId) use ($sessionCounts) {
                $clone = clone $row;
                $clone->cnt = (int) $row->cnt + ($sessionCounts[$memberId] ?? 0);
                return $clone;
            });

            // Filtrer selon mode
            $pool = $this->filterByMode($members, $mode, $date);

            $best      = null;
            $bestScore = PHP_INT_MIN;

            foreach ($pool as $m) {
                $score = $this->rotationService->compositeScore($m, $sessionStats->get($m->id), $maxDays);
                if ($score > $bestScore) {
                    $bestScore = $score;
                    $best      = $m;
                }
            }

            if ($best) {
                $sessionCounts[$best->id] = ($sessionCounts[$best->id] ?? 0) + 1;
                $assignments[] = [
                    'member_id'   => $best->id,
                    'member_name' => $best->full_name,
                    'house_id'    => $best->house_id,
                    'house_label' => $best->house?->label ?? $best->house?->address,
                    'date'        => $date,
                ];
            } else {
                $assignments[] = null;
            }
        }

        return $assignments;
    }

    private function filterByMode(Collection $members, string $mode, string $date): Collection
    {
        return match ($mode) {
            'balanced'  => $members->where('availability_status', 'available'),
            'stable'    => $members->whereIn('availability_status', ['available', 'travel']),
            'urgent'    => $members->where('availability_status', '!=', 'suspended'),
            'geographic'=> $members->where('availability_status', 'available'),
            default     => $members,
        };
    }

    private function changeType(Rotation $old, ?array $newSlot): string
    {
        if (! $newSlot) {
            return 'unchanged';
        }

        if ($old->member_id !== ($newSlot['member_id'] ?? null)) {
            return 'member_changed';
        }

        if ($old->house_id !== ($newSlot['house_id'] ?? null)) {
            return 'house_changed';
        }

        return 'unchanged';
    }

    private function inferDahiraId(array $diff): ?int
    {
        foreach ($diff as $slot) {
            if (isset($slot['rotation_id'])) {
                $r = Rotation::withoutGlobalScopes()->find($slot['rotation_id']);
                if ($r) {
                    return $r->dahira_id;
                }
            }
        }
        return null;
    }
}
