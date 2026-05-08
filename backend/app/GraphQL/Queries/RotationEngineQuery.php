<?php

namespace App\GraphQL\Queries;

use App\Models\Rotation;
use App\Services\RotationLogService;
use App\Services\RotationPlannerService;
use App\Services\RotationReplannerService;

class RotationEngineQuery
{
    public function __construct(
        private readonly RotationLogService     $logService,
        private readonly RotationReplannerService $replannerService,
        private readonly RotationPlannerService  $plannerService,
    ) {}

    /** Returns the chronological change log for a rotation. */
    public function logs(mixed $root, array $args): array
    {
        return $this->logService
            ->getHistory((int) $args['rotation_id'])
            ->map(fn ($entry) => [
                ...$entry,
                'meta' => json_encode($entry['meta'] ?? []),
            ])
            ->toArray();
    }

    /** Analyses a problem and returns ranked solutions with scores. */
    public function suggestSolution(mixed $root, array $args): array
    {
        $rotation = Rotation::findOrFail((int) $args['rotation_id']);
        $result   = $this->replannerService->suggestBestSolution($rotation, $args['reason']);

        return [
            'gravity'              => $result['gravity'],
            'confidence'           => $result['confidence'],
            'score'                => (float) $result['score'],
            'recommended_solution' => $result['recommended_solution'],
            'confidence_score'     => (float) $result['confidence_score'],
            'all_solutions'        => $result['all_solutions'] ?? [],
        ];
    }

    /** Previews a rebuild without persisting any changes. */
    public function previewRebuild(mixed $root, array $args): array
    {
        return $this->plannerService->previewRebuild(
            (int) $args['dahira_id'],
            $args['from'],
            (int) ($args['weeks'] ?? 12),
            $args['mode'] ?? 'balanced',
        );
    }
}
