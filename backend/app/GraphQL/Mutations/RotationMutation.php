<?php

namespace App\GraphQL\Mutations;

use App\Models\Rotation;
use App\Services\RotationLogService;
use App\Services\RotationPlannerService;
use App\Services\RotationCascadeService;
use App\Services\RotationService;
use Carbon\Carbon;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

final class RotationMutation
{
    public function __construct(
        private readonly RotationService        $service,
        private readonly RotationPlannerService $planner,
        private readonly RotationLogService     $logger,
        private readonly RotationCascadeService $cascade,
    ) {}

    /**
     * Auto-selects the best house and creates the rotation.
     */
    public function autoSchedule(null $root, array $args): Rotation
    {
        $house = $this->service->suggestNextHouse(
            (int) $args['dahira_id'],
            $args['scheduled_date']
        );

        if (! $house) {
            throw new Error(
                'Aucune maison éligible trouvée. Vérifiez les disponibilités et les intervalles minimum.'
            );
        }

        $member = $this->service->suggestNextMember($house);

        return $this->service->createRotation(
            (int) $args['dahira_id'],
            $house->id,
            $args['scheduled_date'],
            $member?->id,
        );
    }

    /**
     * Manually schedule a rotation for a specific member (house derived from member).
     *
     * force_rebuild = true :
     *   - Si un tour existe déjà à cette date → il est remplacé (statut cancelled) et loggé
     *   - Le planning futur flexible (>=2 semaines) est recalculé via RotationPlannerService
     */
    public function schedule(null $root, array $args): array
    {
        $member  = \App\Models\Member::findOrFail((int) $args['member_id']);
        $houseId = $args['house_id'] ?? $member->house_id;

        if (! $houseId) {
            throw new Error("Le membre sélectionné n'a pas de maison assignée.");
        }

        $dahiraId      = (int) $args['dahira_id'];
        $scheduledDate = $args['scheduled_date'];
        $forceRebuild  = (bool) ($args['force_rebuild'] ?? false);
        $insertMode    = (bool) ($args['insert_mode']   ?? false);
        $notes         = $args['notes'] ?? null;

        return DB::transaction(function () use ($dahiraId, $houseId, $scheduledDate, $member, $forceRebuild, $insertMode, $notes): array {
            $replacedRotation = null;
            $rebuildCount     = 0;

            // Détecter un tour existant à cette date
            $existing = Rotation::where('dahira_id', $dahiraId)
                ->where('scheduled_date', $scheduledDate)
                ->whereIn('status', ['planned', 'confirmed'])
                ->first();

            if ($existing) {
                if ($insertMode) {
                    // INSERT : décaler le tour existant et tous les suivants de +1 semaine
                    $shiftedCount = $this->cascade->insertShift($existing, 'INSERT', null);
                    $rebuildCount = $shiftedCount;
                } elseif ($forceRebuild) {
                    // REPLACE : annuler l'existant et reconstruire le planning
                    $existing->update(['status' => 'cancelled']);
                    $this->logger->logChange($existing, 'replaced_by_manual', [
                        'new_member_id'   => $member->id,
                        'new_member_name' => $member->full_name,
                    ]);
                    $replacedRotation = $existing;
                } else {
                    throw new Error(
                        "Un tour est déjà planifié le {$scheduledDate}. Choisissez \"Insérer\" ou \"Remplacer\"."
                    );
                }
            }

            // Créer le nouveau tour
            $rotation = $this->service->createRotation($dahiraId, (int) $houseId, $scheduledDate, $member->id);
            if ($notes) {
                $rotation->update(['notes' => $notes]);
            }

            // Reconstruire le planning futur si demandé (mode REPLACE)
            if ($forceRebuild && $replacedRotation) {
                $fromDate = Carbon::parse($scheduledDate)->addWeeks(2)->toDateString();
                $preview  = $this->planner->previewRebuild($dahiraId, $fromDate, 12, 'balanced');
                if (! empty($preview['preview'])) {
                    $updated      = $this->planner->applyRebuild($preview);
                    $rebuildCount = $updated->count();
                }
            }

            return [
                'rotation'          => $rotation,
                'replaced_rotation' => $replacedRotation,
                'rebuild_applied'   => $forceRebuild || $insertMode,
                'rebuild_count'     => $rebuildCount,
            ];
        });
    }

    /**
     * Auto-schedules one rotation per Sunday between start_date and end_date.
     * Skips Sundays where no eligible house is found.
     */
    public function schedulePeriod(null $root, array $args): array
    {
        $dahiraId  = (int) $args['dahira_id'];
        $endDate   = Carbon::parse($args['end_date']);

        // Start from the first Sunday on or after start_date
        $current = Carbon::parse($args['start_date']);
        if ($current->dayOfWeek !== Carbon::SUNDAY) {
            $current->next(Carbon::SUNDAY);
        }

        $rotations    = [];
        $skippedDates = [];

        DB::transaction(function () use ($dahiraId, $current, $endDate, &$rotations, &$skippedDates) {
            while ($current->lte($endDate)) {
                $dateStr = $current->format('Y-m-d');
                // Use non-strict interval so all Sundays are always scheduled
                $house   = $this->service->suggestNextHouse($dahiraId, $dateStr, false);

                if ($house) {
                    $member      = $this->service->suggestNextMember($house);
                    $rotations[] = $this->service->createRotation($dahiraId, $house->id, $dateStr, $member?->id);
                } else {
                    $skippedDates[] = $dateStr;
                }

                $current->addWeek();
            }
        });

        return [
            'rotations'     => $rotations,
            'created_count' => count($rotations),
            'skipped_dates' => $skippedDates,
            'skipped_count' => count($skippedDates),
        ];
    }

    /**
     * Update rotation status and handle side-effects (house stats on done).
     */
    public function updateStatus(null $root, array $args): Rotation
    {
        $rotation = Rotation::findOrFail($args['id']);

        return $this->service->updateStatus($rotation, $args['status']);
    }

    /**
     * Reorder existing future rotations by reassigning their dates.
     *
     * The dates are treated as fixed slots (sorted chronologically).
     * The caller sends the new order of rotation IDs; each rotation
     * receives the date that belongs to its new slot index.
     *
     * Example: [R1:Jan5, R2:Jan12, R3:Jan19] reordered to [R3, R1, R2]
     *          → R3 gets Jan5, R1 gets Jan12, R2 gets Jan19
     */
    public function reorder(null $root, array $args): array
    {
        $dahiraId = (int) $args['dahira_id'];
        $ids      = $args['rotation_ids'];

        return DB::transaction(function () use ($dahiraId, $ids): array {
            $rotations = Rotation::whereIn('id', $ids)
                ->where('dahira_id', $dahiraId)
                ->whereIn('status', ['planned', 'confirmed'])
                ->with(['member', 'house'])
                ->get()
                ->keyBy('id');

            if ($rotations->count() !== count($ids)) {
                throw new Error(
                    'Certaines rotations sont introuvables ou ne peuvent pas être réordonnées (statut invalide).'
                );
            }

            // Dates fixes dans l'ordre chronologique original
            $sortedDates = $rotations
                ->sortBy('scheduled_date')
                ->pluck('scheduled_date')
                ->values();

            $updated = [];
            foreach ($ids as $index => $id) {
                $rotation = $rotations[(string) $id];
                $rotation->scheduled_date = $sortedDates[$index];
                $rotation->save();
                $updated[] = $rotation;
            }

            return $updated;
        });
    }

    /**
     * Bulk-create rotations from a custom drag-and-drop plan.
     *
     * Each entry provides member_id, optional house_id and a specific scheduled_date.
     * If clear_future=true, all planned/confirmed rotations after today are deleted first.
     * Existing rotations on the same date are skipped (counted as skipped).
     */
    public function planCustom(null $root, array $args): array
    {
        $dahiraId    = (int) $args['dahira_id'];
        $entries     = $args['entries'];
        $clearFuture = (bool) ($args['clear_future'] ?? false);

        return DB::transaction(function () use ($dahiraId, $entries, $clearFuture): array {
            // Optionally wipe all future planned / confirmed rotations
            if ($clearFuture) {
                Rotation::where('dahira_id', $dahiraId)
                    ->whereIn('status', ['planned', 'confirmed'])
                    ->where('scheduled_date', '>', now()->toDateString())
                    ->delete();
            }

            // Collect occupied dates to detect conflicts
            $occupied = Rotation::where('dahira_id', $dahiraId)
                ->whereIn('status', ['planned', 'confirmed'])
                ->pluck('scheduled_date')
                ->map(fn($d) => $d instanceof \Carbon\Carbon ? $d->toDateString() : (string) $d)
                ->flip()
                ->all();

            $created  = [];
            $skipped  = 0;

            foreach ($entries as $entry) {
                $raw  = $entry['scheduled_date'];
                $date = $raw instanceof \Carbon\Carbon ? $raw->toDateString() : (string) $raw;
                $memberId = (int) $entry['member_id'];

                // Skip if a rotation already exists at this date
                if (isset($occupied[$date])) {
                    $skipped++;
                    continue;
                }

                // Resolve house: explicit > member's house
                $houseId = isset($entry['house_id']) && $entry['house_id']
                    ? (int) $entry['house_id']
                    : \App\Models\Member::find($memberId)?->house_id;

                if (! $houseId) {
                    $skipped++;
                    continue;
                }

                $rotation = $this->service->createRotation($dahiraId, $houseId, $date, $memberId);
                $created[] = $rotation;
                $occupied[$date] = true;  // prevent duplicate dates in same batch
            }

            return [
                'created_count' => count($created),
                'skipped_count' => $skipped,
                'rotations'     => $created,
            ];
        });
    }
}
