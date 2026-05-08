<?php

namespace App\Services;

use App\Models\House;
use App\Models\Member;
use App\Models\Rotation;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RotationReplannerService
{
    public function __construct(private readonly RotationService $rotationService) {}

    /**
     * Analyses a rotation problem and returns a structured description.
     *
     * @return array{rotation_id:int, reason:string, scheduled_date:string, days_until:int, member_id:int|null, house_id:int}
     */
    public function detectProblem(Rotation $rotation, string $reason): array
    {
        $daysUntil = Carbon::today()->diffInDays(Carbon::parse($rotation->scheduled_date), false);

        return [
            'rotation_id'    => $rotation->id,
            'reason'         => $reason,
            'scheduled_date' => $rotation->scheduled_date->toDateString(),
            'days_until'     => (int) $daysUntil,
            'member_id'      => $rotation->member_id,
            'house_id'       => $rotation->house_id,
            'current_status' => $rotation->status,
        ];
    }

    /**
     * Classifies problem gravity: 'low' | 'medium' | 'high'.
     *
     * low    → tour dans < 14 jours   (locked zone)
     * medium → tour dans 14-56 jours  (soft zone)
     * high   → tour au-delà ou raison grave
     */
    public function classifyGravity(array $problem): string
    {
        $criticalReasons = ['death', 'epidemic', 'flood', 'ramadan', 'magal'];
        $daysUntil       = $problem['days_until'] ?? 99;

        if (in_array($problem['reason'] ?? '', $criticalReasons, true)) {
            return 'high';
        }

        if ($daysUntil < 14) {
            return 'low';
        }

        if ($daysUntil < 56) {
            return 'medium';
        }

        return 'high';
    }

    /**
     * Generates all viable solutions for the given rotation problem.
     *
     * Possible solution types:
     *   swap_next       — échanger avec le prochain tour disponible
     *   headquarters    — tenir au siège sans modifier le planning
     *   postpone        — reporter d'une semaine
     *   smart_swap      — chercher le meilleur candidat dans les 8 semaines
     *   volunteer_house — trouver une maison volontaire
     */
    public function generateSolutions(Rotation $rotation): Collection
    {
        $dahiraId = $rotation->dahira_id;
        $date     = Carbon::parse($rotation->scheduled_date);
        $solutions = collect();

        // Option 1 : Siège
        $hq = House::where('dahira_id', $dahiraId)->where('is_headquarters', true)->first();
        if ($hq) {
            $solutions->push([
                'type'     => 'headquarters',
                'label'    => 'Tenir au siège du Dahira',
                'house_id' => $hq->id,
                'date'     => $rotation->scheduled_date->toDateString(),
                'member_id'=> null,
            ]);
        }

        // Option 2 : Swap with next rotation
        $nextRotation = Rotation::where('dahira_id', $dahiraId)
            ->where('id', '!=', $rotation->id)
            ->where('scheduled_date', '>', $rotation->scheduled_date)
            ->whereIn('status', ['planned', 'confirmed'])
            ->orderBy('scheduled_date')
            ->first();

        if ($nextRotation) {
            $solutions->push([
                'type'           => 'swap_next',
                'label'          => "Échanger avec {$nextRotation->scheduled_date->toDateString()}",
                'rotation_a_id'  => $rotation->id,
                'rotation_b_id'  => $nextRotation->id,
                'date'           => $nextRotation->scheduled_date->toDateString(),
                'member_id'      => $nextRotation->member_id,
                'house_id'       => $nextRotation->house_id,
            ]);
        }

        // Option 3 : Reporter d'une semaine
        $postponedDate = $date->copy()->addWeek()->toDateString();
        $solutions->push([
            'type'    => 'postpone',
            'label'   => "Reporter au {$postponedDate}",
            'date'    => $postponedDate,
            'house_id'=> $rotation->house_id,
            'member_id'=> $rotation->member_id,
        ]);

        // Option 4 : Smart swap — meilleur candidat dans les 8 semaines
        $smartCandidate = Rotation::where('dahira_id', $dahiraId)
            ->where('id', '!=', $rotation->id)
            ->where('scheduled_date', '>', $rotation->scheduled_date)
            ->where('scheduled_date', '<=', $date->copy()->addWeeks(8))
            ->whereIn('status', ['planned', 'confirmed'])
            ->with(['member', 'house.members'])
            ->get()
            ->sortByDesc(function (Rotation $r) {
                $memberStats = Rotation::where('member_id', $r->member_id)
                    ->whereIn('status', ['planned', 'confirmed', 'completed'])
                    ->count();
                return -$memberStats; // préférer celui qui a le moins de tours
            })
            ->first();

        if ($smartCandidate && $smartCandidate->id !== ($nextRotation?->id)) {
            $solutions->push([
                'type'           => 'smart_swap',
                'label'          => "Échange intelligent avec {$smartCandidate->scheduled_date->toDateString()}",
                'rotation_a_id'  => $rotation->id,
                'rotation_b_id'  => $smartCandidate->id,
                'date'           => $smartCandidate->scheduled_date->toDateString(),
                'member_id'      => $smartCandidate->member_id,
                'house_id'       => $smartCandidate->house_id,
            ]);
        }

        // Option 5 : Maison volontaire (disponible + pas en cooldown)
        $volunteer = House::where('dahira_id', $dahiraId)
            ->where('id', '!=', $rotation->house_id)
            ->where('is_available', true)
            ->where('is_headquarters', false)
            ->with(['members' => fn ($q) => $q->where('is_active', true)])
            ->get()
            ->filter(fn (House $h) => $h->members->isNotEmpty())
            ->first();

        if ($volunteer) {
            $solutions->push([
                'type'     => 'volunteer_house',
                'label'    => "Maison volontaire : {$volunteer->label}",
                'house_id' => $volunteer->id,
                'date'     => $rotation->scheduled_date->toDateString(),
                'member_id'=> null,
            ]);
        }

        return $solutions;
    }

    /**
     * Scores a solution 0–100 using weighted criteria:
     *   équité(40%) + stabilité calendrier(30%) + disponibilité(20%) + distance(10%)
     */
    public function scoreSolution(array $solution, Rotation $rotation): float
    {
        $equityScore      = $this->equityScore($solution, $rotation);
        $stabilityScore   = $this->stabilityScore($solution, $rotation);
        $availabilityScore= $this->availabilityScore($solution);
        $distanceScore    = $this->distanceScore($solution, $rotation);

        return round(
            0.40 * $equityScore
          + 0.30 * $stabilityScore
          + 0.20 * $availabilityScore
          + 0.10 * $distanceScore,
            2
        );
    }

    /**
     * Suggests the single best solution with confidence score.
     *
     * @return array{solution: array, score: float, confidence: string, gravity: string}
     */
    public function suggestBestSolution(Rotation $rotation, string $reason): array
    {
        $problem  = $this->detectProblem($rotation, $reason);
        $gravity  = $this->classifyGravity($problem);
        $solutions = $this->generateSolutions($rotation);

        if ($solutions->isEmpty()) {
            return [
                'solution'   => [],
                'score'      => 0,
                'confidence' => 'none',
                'gravity'    => $gravity,
            ];
        }

        $scored = $solutions->map(fn ($sol) => [
            ...$sol,
            '_score' => $this->scoreSolution($sol, $rotation),
        ])->sortByDesc('_score');

        $best = $scored->first();

        $confidence = match (true) {
            $best['_score'] >= 80 => 'high',
            $best['_score'] >= 55 => 'medium',
            default               => 'low',
        };

        return [
            'solution'        => $best,
            'score'           => $best['_score'],
            'all_solutions'   => $scored->values()->toArray(),
            'confidence'      => $confidence,
            'gravity'         => $gravity,
            'recommended_solution' => $best['type'],
            'confidence_score'     => $best['_score'],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    //  Scoring helpers
    // ─────────────────────────────────────────────────────────────

    private function equityScore(array $solution, Rotation $rotation): float
    {
        // Headquarters ne perturbe pas l'équité → score max
        if ($solution['type'] === 'headquarters') {
            return 100;
        }

        // Swap avec quelqu'un qui a peu de tours → équitable
        $memberId = $solution['member_id'] ?? null;
        if (! $memberId) {
            return 70;
        }

        $tourCount = Rotation::where('member_id', $memberId)
            ->whereIn('status', ['planned', 'confirmed', 'completed'])
            ->count();

        // Moins de tours = plus équitable
        return max(0, 100 - ($tourCount * 20));
    }

    private function stabilityScore(array $solution, Rotation $rotation): float
    {
        return match ($solution['type']) {
            'headquarters' => 100,  // planning inchangé
            'postpone'     => 60,   // léger décalage
            'swap_next'    => 75,   // swap simple
            'smart_swap'   => 65,   // swap plus lointain
            'volunteer_house' => 50,
            default        => 50,
        };
    }

    private function availabilityScore(array $solution): float
    {
        $memberId = $solution['member_id'] ?? null;
        if (! $memberId) {
            return 80; // pas de membre spécifique impliqué
        }

        $member = Member::find($memberId);
        if (! $member) {
            return 50;
        }

        return match ($member->availability_status ?? 'available') {
            'available'   => 100,
            'unavailable' => 0,
            'travel'      => 30,
            'sick'        => 10,
            'suspended'   => 0,
            default       => 50,
        };
    }

    private function distanceScore(array $solution, Rotation $rotation): float
    {
        // Même maison ou siège → distance 0 = score max
        if (($solution['house_id'] ?? null) === $rotation->house_id) {
            return 100;
        }

        if ($solution['type'] === 'headquarters') {
            return 80;
        }

        // Distance non connue (pas de coordonnées) → neutre
        return 60;
    }
}
