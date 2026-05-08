<?php

namespace App\GraphQL\Queries;

use App\Models\Rotation;
use App\Services\RotationCascadeService;

final class RotationCascadeQuery
{
    public function __construct(
        private readonly RotationCascadeService $cascade
    ) {}

    /**
     * Dry-run: returns a CascadePreview without modifying anything.
     */
    public function preview(null $root, array $args): array
    {
        $rotation   = Rotation::with(['member', 'house'])->findOrFail($args['from_rotation_id']);
        $mode       = strtolower($args['mode']);
        $shiftWeeks = (int) ($args['shift_weeks'] ?? 1);

        return $this->cascade->previewCascade($rotation, $mode, $shiftWeeks);
    }
}
