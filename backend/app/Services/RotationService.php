<?php

namespace App\Services;

use App\Models\House;
use App\Models\Rotation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RotationService
{
    /**
     * Suggests the best house for the next rotation based on 6 criteria:
     * 1. Days since last visit (higher = better priority)
     * 2. Total rotations received (lower = better equity)
     * 3. Hosting capacity
     * 4. Availability flag
     * 5. Minimum interval respect (min_interval_weeks)
     * 6. Family head seniority
     *
     * Returns null when no eligible house exists.
     */
    public function suggestNextHouse(int $dahiraId, string $scheduledDate): ?House
    {
        $date = Carbon::parse($scheduledDate);

        $houses = House::where('dahira_id', $dahiraId)
            ->where('is_available', true)
            ->with([
                'family',
                'family.members' => fn ($q) => $q->where('is_family_head', true),
                'rotations'      => fn ($q) => $q->orderByDesc('scheduled_date')->limit(1),
            ])
            ->get();

        $eligible = $houses->filter(fn (House $h) => $this->respectsMinInterval($h, $date));

        if ($eligible->isEmpty()) {
            return null;
        }

        return $eligible
            ->sortByDesc(fn (House $h) => $this->score($h, $date))
            ->first();
    }

    /**
     * Creates a rotation record.
     */
    public function createRotation(int $dahiraId, int $houseId, string $scheduledDate): Rotation
    {
        return Rotation::create([
            'dahira_id'      => $dahiraId,
            'house_id'       => $houseId,
            'scheduled_date' => $scheduledDate,
            'status'         => 'planned',
        ]);
    }

    /**
     * Updates rotation status.
     * When marked as done, atomically refreshes the family stats.
     */
    public function updateStatus(Rotation $rotation, string $status): Rotation
    {
        return DB::transaction(function () use ($rotation, $status): Rotation {
            $rotation->update(['status' => $status]);

            if ($status === 'done') {
                $house = $rotation->house()->with('family')->first();
                if ($house?->family) {
                    $house->family->increment('total_received');
                    $house->family->update(['last_received_at' => $rotation->scheduled_date]);
                }
            }

            return $rotation->fresh();
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────

    private function respectsMinInterval(House $house, Carbon $date): bool
    {
        $lastRotation = $house->rotations->first();
        if (! $lastRotation) {
            return true;
        }

        $weeksSinceLast = Carbon::parse($lastRotation->scheduled_date)->diffInWeeks($date);

        return $weeksSinceLast >= $house->min_interval_weeks;
    }

    private function score(House $house, Carbon $date): float
    {
        $score  = 0.0;
        $family = $house->family;

        // Criterion 1 — days since last rotation (1000 bonus if never visited)
        $lastRotation = $house->rotations->first();
        if ($lastRotation) {
            $days   = Carbon::parse($lastRotation->scheduled_date)->diffInDays($date);
            $score += $days * 0.5;
        } else {
            $score += 1000;
        }

        // Criterion 2 — equity: fewer total received = higher score
        // Always use family->total_received as canonical source; 0 if no family
        $total  = $family?->total_received ?? 0;
        $score += max(0, 200 - $total * 10);

        // Criterion 3 — hosting capacity (slight bonus)
        $score += $house->capacity * 0.2;

        // Criterion 6 — family head seniority (older = higher score)
        if ($family) {
            $head = $family->members->first();
            if ($head?->joined_at) {
                $months = Carbon::parse($head->joined_at)->diffInMonths(now());
                $score += $months * 0.3;
            }
        }

        return $score;
    }
}
