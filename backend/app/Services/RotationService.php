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
                'rotations as scheduled_count' => fn ($q) => $q->whereIn('status', ['planned', 'confirmed', 'completed']),
            ])
            ->get();

        if ($houses->isEmpty()) {
            return null;
        }

        $houses = $houses->filter(fn (House $h) => $h->members->isNotEmpty());

        if ($houses->isEmpty()) {
            return null;
        }

        $totalMembers   = $houses->sum(fn (House $h) => $h->members->count());
        $totalRotations = $houses->sum(
            fn (House $h) => ($h->scheduled_count ?? 0) + ($extraCounts[$h->id] ?? 0)
        );

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
     * Picks the best member using a composite priority score (L2).
     *
     * score = 35% × days_without_tour
     *       + 25% × availability_bonus
     *       − 20% × absence_frequency
     *       − 15% × recency_penalty
     *       − 5%  × suspension_penalty
     *
     * Suspended members are never selected.
     */
    public function suggestNextMember(House $house): ?Member
    {
        $members = $house->relationLoaded('members')
            ? $house->members->where('is_active', true)->where('availability_status', '!=', 'suspended')
            : $house->members()->where('is_active', true)->where('availability_status', '!=', 'suspended')->get();

        if ($members->isEmpty()) {
            return null;
        }

        $stats = Rotation::whereIn('member_id', $members->pluck('id'))
            ->whereIn('status', ['planned', 'confirmed', 'completed', 'ongoing', 'headquarters'])
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

        $best   = null;
        $bestScore = PHP_INT_MIN;

        foreach ($members as $m) {
            $score = $this->compositeScore($m, $stats->get($m->id), $maxDays);
            $this->updatePriorityScore($m, $score);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best      = $m;
            }
        }

        return $best;
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
     * When marked completed, increments house stats.
     */
    public function updateStatus(Rotation $rotation, string $status): Rotation
    {
        return DB::transaction(function () use ($rotation, $status): Rotation {
            $rotation->update(['status' => $status]);

            if ($status === 'completed') {
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
    //  Score composite
    // ─────────────────────────────────────────────────────────────

    /**
     * Composite priority score — higher is better.
     *
     * Weights: days_without_tour(35) + availability(25) − absence_freq(20)
     *          − recency(15) − suspension(5)
     */
    public function compositeScore(Member $member, ?object $stats, int $maxDays): float
    {
        // 35% — jours depuis le dernier tour (normalisé 0-100)
        $daysSinceLast = $stats?->last_date
            ? Carbon::parse($stats->last_date)->diffInDays(now())
            : 365;
        $daysScore = $maxDays > 0 ? ($daysSinceLast / $maxDays) * 100 : 100;

        // 25% — disponibilité
        $availabilityScore = match ($member->availability_status ?? 'available') {
            'available'   => 100,
            'unavailable' => 0,
            'travel'      => 20,
            'sick'        => 0,
            'suspended'   => -200, // disqualified
            default       => 50,
        };

        // 20% — pénalité fréquence d'absences (0–100, inversé)
        $absencePenalty = min(100, ($member->absence_frequency ?? 0) * 10);

        // 15% — pénalité si tour récent
        $totalRotations = (int) ($stats?->cnt ?? 0);
        $recencyPenalty = min(100, $totalRotations * 15);

        // 5% — statut suspendu
        $suspensionPenalty = ($member->availability_status === 'suspended') ? 100 : 0;

        return (0.35 * $daysScore)
             + (0.25 * $availabilityScore)
             - (0.20 * $absencePenalty)
             - (0.15 * $recencyPenalty)
             - (0.05 * $suspensionPenalty);
    }

    // ─────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────

    private function updatePriorityScore(Member $member, float $score): void
    {
        $member->priority_score = round($score, 4);
        $member->saveQuietly();
    }

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
