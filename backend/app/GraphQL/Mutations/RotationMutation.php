<?php

namespace App\GraphQL\Mutations;

use App\Models\Rotation;
use App\Services\RotationService;
use GraphQL\Error\Error;

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

        return $this->service->createRotation(
            (int) $args['dahira_id'],
            $house->id,
            $args['scheduled_date']
        );
    }

    /**
     * Manually schedule a rotation with an explicit house.
     */
    public function schedule(null $root, array $args): Rotation
    {
        return $this->service->createRotation(
            (int) $args['dahira_id'],
            (int) $args['house_id'],
            $args['scheduled_date']
        );
    }

    /**
     * Update rotation status and handle side-effects (family stats on done).
     */
    public function updateStatus(null $root, array $args): Rotation
    {
        $rotation = Rotation::findOrFail($args['id']);

        return $this->service->updateStatus($rotation, $args['status']);
    }
}
