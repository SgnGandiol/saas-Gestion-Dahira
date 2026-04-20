<?php

namespace App\GraphQL\Mutations;

use App\Models\Rotation;
use App\Services\RotationService;
use Carbon\Carbon;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

final class RotationMutation
{
    public function __construct(private readonly RotationService $service) {}

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
     * Manually schedule a rotation with an explicit house.
     */
    public function schedule(null $root, array $args): Rotation
    {
        $house  = \App\Models\House::findOrFail((int) $args['house_id']);
        $member = $this->service->suggestNextMember($house);

        return $this->service->createRotation(
            (int) $args['dahira_id'],
            $house->id,
            $args['scheduled_date'],
            $member?->id,
        );
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
     * Moves a rotation to a new date (only allowed for planned/confirmed).
     */
    public function reschedule(null $root, array $args): Rotation
    {
        $rotation = Rotation::findOrFail($args['id']);

        if (in_array($rotation->status, ['done', 'cancelled'])) {
            throw new Error('Impossible de repousser un tour déjà effectué ou annulé.');
        }

        $rotation->update(['scheduled_date' => $args['scheduled_date']]);

        return $rotation->fresh();
    }

    /**
     * Update rotation status and handle side-effects (house stats on done).
     */
    public function updateStatus(null $root, array $args): Rotation
    {
        $rotation = Rotation::findOrFail($args['id']);

        return $this->service->updateStatus($rotation, $args['status']);
    }
}
