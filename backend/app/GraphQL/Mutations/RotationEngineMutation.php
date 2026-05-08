<?php

namespace App\GraphQL\Mutations;

use App\Models\Member;
use App\Models\Rotation;
use App\Services\RotationLogService;
use App\Services\RotationPlannerService;
use App\Services\RotationReplannerService;
use GraphQL\Error\Error;

class RotationEngineMutation
{
    public function __construct(
        private readonly RotationLogService     $logService,
        private readonly RotationPlannerService  $plannerService,
        private readonly RotationReplannerService $replannerService,
    ) {}

    /** Updates a member's availability status and logs the change. */
    public function updateAvailability(mixed $root, array $args): Member
    {
        $member = Member::findOrFail((int) $args['id']);
        $old    = $member->availability_status;

        $member->update(['availability_status' => $args['availability_status']]);

        // Log on the member's most recent planned rotation if any
        $rotation = Rotation::where('member_id', $member->id)
            ->whereIn('status', ['planned', 'confirmed'])
            ->orderBy('scheduled_date')
            ->first();

        if ($rotation) {
            $this->logService->logChange($rotation, 'availability_updated', [
                'old_status' => $old,
                'new_status' => $args['availability_status'],
                'member_id'  => $member->id,
            ]);
        }

        return $member->fresh();
    }

    /**
     * Applies a previewed rebuild to the database.
     * The full preview array (as JSON in the GraphQL input) is required.
     */
    public function applyRebuild(mixed $root, array $args): array
    {
        $preview = $args['preview'];

        // Convert GraphQL input objects to plain arrays
        $previewData = [
            'preview' => array_map(fn ($item) => (array) $item, $preview['preview'] ?? []),
            'meta'    => (array) ($preview['meta'] ?? []),
        ];

        return $this->plannerService->applyRebuild($previewData)->all();
    }

    /** Cancels a rebuild, restoring original assignments. */
    public function cancelRebuild(mixed $root, array $args): bool
    {
        return $this->plannerService->cancelRebuild((int) $args['rebuild_id']);
    }

    /**
     * Applies one of the suggested solutions to a rotation.
     * solution_type: headquarters|swap_next|smart_swap|postpone|volunteer_house
     */
    public function applySolution(mixed $root, array $args): Rotation
    {
        $rotation = Rotation::findOrFail((int) $args['rotation_id']);
        $type     = $args['solution_type'];
        $meta     = json_decode($args['meta'] ?? '{}', true) ?? [];

        $result  = $this->replannerService->suggestBestSolution($rotation, $meta['reason'] ?? 'manual');
        $solution = collect($result['all_solutions'] ?? [])->firstWhere('type', $type);

        if (! $solution) {
            throw new Error("Solution '{$type}' non disponible pour cette rotation.");
        }

        return match ($type) {
            'headquarters' => $this->applyHeadquarters($rotation, $solution),
            'swap_next', 'smart_swap' => $this->applySwap($rotation, $solution),
            'postpone'     => $this->applyPostpone($rotation, $solution),
            'volunteer_house' => $this->applyVolunteerHouse($rotation, $solution),
            default        => throw new Error("Type de solution inconnu : {$type}"),
        };
    }

    // ─────────────────────────────────────────────────────────────

    private function applyHeadquarters(Rotation $rotation, array $solution): Rotation
    {
        $old = ['status' => $rotation->status, 'house_id' => $rotation->house_id];
        $rotation->update([
            'house_id' => $solution['house_id'],
            'status'   => 'headquarters',
        ]);
        $this->logService->logChange($rotation, 'solution_headquarters', $old);
        return $rotation->fresh();
    }

    private function applySwap(Rotation $rotation, array $solution): Rotation
    {
        $rotationB = Rotation::findOrFail($solution['rotation_b_id']);

        $memberA  = $rotation->member_id;
        $houseA   = $rotation->house_id;
        $memberB  = $rotationB->member_id;
        $houseB   = $rotationB->house_id;

        $rotation->update(['member_id' => $memberB, 'house_id' => $houseB, 'status' => 'rescheduled']);
        $rotationB->update(['member_id' => $memberA, 'house_id' => $houseA]);

        $this->logService->logChange($rotation, 'solution_swap', [
            'swap_type'      => $solution['type'],
            'rotation_b_id'  => $rotationB->id,
            'old_member_id'  => $memberA,
            'new_member_id'  => $memberB,
        ]);

        return $rotation->fresh();
    }

    private function applyPostpone(Rotation $rotation, array $solution): Rotation
    {
        $oldDate = $rotation->scheduled_date->toDateString();
        $rotation->update([
            'scheduled_date' => $solution['date'],
            'status'         => 'rescheduled',
        ]);
        $this->logService->logChange($rotation, 'solution_postpone', [
            'old_date' => $oldDate,
            'new_date' => $solution['date'],
        ]);
        return $rotation->fresh();
    }

    private function applyVolunteerHouse(Rotation $rotation, array $solution): Rotation
    {
        $oldHouseId = $rotation->house_id;
        $rotation->update([
            'house_id' => $solution['house_id'],
            'status'   => 'rescheduled',
        ]);
        $this->logService->logChange($rotation, 'solution_volunteer_house', [
            'old_house_id' => $oldHouseId,
            'new_house_id' => $solution['house_id'],
        ]);
        return $rotation->fresh();
    }
}
