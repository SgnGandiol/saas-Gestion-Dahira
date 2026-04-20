<?php

namespace App\Services;

use App\Models\House;
use App\Models\Member;
use App\Models\Rotation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RotationService
{
    /**
     * Selects the house with the highest debt using Deficit Round Robin.
     *
     * Debt formula:
     *   debt(H) = actual_rotations(H) − (total_rotations × active_members(H) / total_active_members)
     *
     * A negative debt means the house is under-served relative to its size.
     * We pick the house with the lowest (most negative) debt.
     *
     * Global totals are computed over ALL available houses (not just the eligible pool)
     * so that a house exiting cooldown sees its correct historical debt.
     *
     * Hard exclusions:
     *   - No active members
     *   - is_available = false
     *   - Cooldown not respected (strict mode only)
     *
     * @param array $extraCounts  rotations already planned in this session (house_id => count)
     */
    public function suggestNextHouse(
        int    $dahiraId,
        string $scheduledDate,
        bool   $strictInterval = true,
        array  $extraCounts    = []
    ): ?House {
        $date = Carbon::parse($scheduledDate);

        $houses = House::where('dahira_id', $dahiraId)
            ->where('is_available', true)
            ->with([
                'rotations' => fn ($q) => $q->orderByDesc('scheduled_date')->limit(1),
                'members'   => fn ($q) => $q->where('is_active', true),
            ])
            ->withCount([
                'rotations as scheduled_count' => fn ($q) => $q->whereIn('status', ['planned', 'confirmed', 'done']),
            ])
            ->get();

        if ($houses->isEmpty()) {
            return null;
        }

        $houses = $houses->filter(fn (House $h) => $h->members->isNotEmpty());

        if ($houses->isEmpty()) {
            return null;
        }

        // Compute global totals over ALL houses (preserve historical debt baseline)
        $totalMembers   = $houses->sum(fn (House $h) => $h->members->count());
        $totalRotations = $houses->sum(
            fn (House $h) => ($h->scheduled_count ?? 0) + ($extraCounts[$h->id] ?? 0)
        );

        // Apply cooldown filter
        $eligible = $houses->filter(fn (House $h) => $this->respectsMinInterval($h, $date));

        $pool = $eligible->isNotEmpty()
            ? $eligible
            : ($strictInterval ? collect() : $houses);

        if ($pool->isEmpty()) {
            return null;
        }

        return $pool
            ->sortBy(fn (House $h) => $this->houseDebt($h, $totalRotations, $totalMembers, $extraCounts[$h->id] ?? 0))
            ->first();
    }

    /**
     * Picks the member with the fewest rotations globally.
     * Members who never hosted get absolute priority.
     * Tiebreaker: days since last rotation (more days = higher priority).
     * Single aggregated query — no N+1.
     */
    public function suggestNextMember(House $house): ?Member
    {
        $members = $house->relationLoaded('members')
            ? $house->members->where('is_active', true)
            : $house->members()->where('is_active', true)->get();

        if ($members->isEmpty()) {
            return null;
        }

        $stats = Rotation::whereIn('member_id', $members->pluck('id'))
            ->whereIn('status', ['planned', 'confirmed', 'done'])
            ->selectRaw('member_id, COUNT(*) as cnt, MAX(scheduled_date) as last_date')
            ->groupBy('member_id')
            ->get()
            ->keyBy('member_id');

        return $members->sortBy(function (Member $m) use ($stats) {
            $row   = $stats->get($m->id);
            $count = (int) ($row?->cnt ?? 0);
            $days  = $row?->last_date
                ? Carbon::parse($row->last_date)->diffInDays(now())
                : PHP_INT_MAX;

            // Primary: fewest rotations. Tiebreaker: longest idle (negative sign = prefer more days)
            return $count - ($days * 0.0001);
        })->first();
    }

    /**
     * Creates a rotation record.
     */
    public function createRotation(int $dahiraId, int $houseId, string $scheduledDate, ?int $memberId = null): Rotation
    {
        return Rotation::create([
            'dahira_id'      => $dahiraId,
            'house_id'       => $houseId,
            'member_id'      => $memberId,
            'scheduled_date' => $scheduledDate,
            'status'         => 'planned',
        ]);
    }

    /**
     * Updates rotation status.
     * When marked as done, increments house stats.
     */
    public function updateStatus(Rotation $rotation, string $status): Rotation
    {
        return DB::transaction(function () use ($rotation, $status): Rotation {
            $rotation->update(['status' => $status]);

            if ($status === 'done') {
                $house = $rotation->house()->first();
                if ($house) {
                    $house->increment('total_received');
                    $house->update(['last_received_at' => $rotation->scheduled_date]);
                }
            }

            return $rotation->fresh();
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Checks that enough weeks have passed since the last rotation.
     * Defaults to 4 weeks when min_interval_weeks is null.
     */
    private function respectsMinInterval(House $house, Carbon $date): bool
    {
        $lastRotation = $house->rotations->first();
        if (! $lastRotation) {
            return true;
        }

        $minWeeks       = $house->min_interval_weeks ?? 4;
        $weeksSinceLast = Carbon::parse($lastRotation->scheduled_date)->diffInWeeks($date);

        return $weeksSinceLast >= $minWeeks;
    }

    /**
     * DRR debt for a house: actual_rotations − fair_share.
     *
     * A house with a lower (more negative) debt is under-served and should be
     * selected next. Tiebreaker: small bonus for houses idle the longest.
     */
    private function houseDebt(House $house, int $totalRotations, int $totalMembers, int $extraCount = 0): float
    {
        $active    = $house->members->count();
        $actual    = ($house->scheduled_count ?? 0) + $extraCount;
        $fairShare = $totalMembers > 0 ? ($totalRotations * $active) / $totalMembers : 0.0;
        $debt      = $actual - $fairShare;

        $last          = $house->rotations->first();
        $daysSinceLast = $last
            ? Carbon::parse($last->scheduled_date)->diffInDays(now())
            : PHP_INT_MAX;

        return $debt - ($daysSinceLast * 0.0001);
    }
}
