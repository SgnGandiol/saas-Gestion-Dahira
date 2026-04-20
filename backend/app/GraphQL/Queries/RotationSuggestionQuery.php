<?php

namespace App\GraphQL\Queries;

use App\Models\House;
use App\Services\RotationService;

final class RotationSuggestionQuery
{
    public function __construct(private readonly RotationService $service) {}

    public function suggest(null $root, array $args): ?House
    {
        return $this->service->suggestNextHouse(
            (int) $args['dahira_id'],
            $args['scheduled_date']
        );
    }
}
