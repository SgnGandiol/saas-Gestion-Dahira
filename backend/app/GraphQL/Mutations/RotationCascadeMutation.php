<?php

namespace App\GraphQL\Mutations;

use App\Models\Rotation;
use App\Services\RotationCascadeService;
use App\Services\RotationLogService;
use GraphQL\Error\Error;

final class RotationCascadeMutation
{
    public function __construct(
        private readonly RotationCascadeService $cascade,
        private readonly RotationLogService     $logger,
    ) {}

    /**
     * Reschedule with cascade — handles HEADQUARTERS, CHAIN, SWAP, GAP modes.
     *
     * Returns CascadeResult.
     */
    public function reschedule(null $root, array $args): array
    {
        $rotation    = Rotation::with(['member', 'house'])->findOrFail($args['id']);
        $mode        = strtolower($args['mode']);
        $motif       = $args['motif'];
        $motifDetail = $args['motif_detail'] ?? null;

        if (in_array($rotation->status, ['completed', 'cancelled'])) {
            throw new Error('Impossible de modifier un tour déjà effectué ou annulé.');
        }

        // ── HEADQUARTERS ─────────────────────────────────────────
        if ($mode === 'headquarters') {
            $hq = $this->cascade->convertToHeadquarters($rotation, $motif, $motifDetail);
            return [
                'applied_count'         => 0,
                'skipped_locked'        => 0,
                'headquarters_rotation' => $hq,
                'rotations'             => [$hq],
            ];
        }

        // ── GAP : seul ce tour bouge ─────────────────────────────
        if ($mode === 'gap') {
            $newDate = $args['scheduled_date'] ?? null;
            if (! $newDate) {
                throw new Error('La nouvelle date est requise pour le mode Sans cascade (GAP).');
            }
            $updated = $this->cascade->applyGap($rotation, $newDate, $motif, $motifDetail);
            return [
                'applied_count'         => 1,
                'skipped_locked'        => 0,
                'headquarters_rotation' => null,
                'rotations'             => [$updated],
            ];
        }

        // ── CHAIN or SWAP : preview + apply ──────────────────────
        $shiftWeeks = (int) ($args['shift_weeks'] ?? 1);
        $preview    = $this->cascade->previewCascade($rotation, $mode, $shiftWeeks);
        $rotations  = $this->cascade->applyCascade($preview, $motif, $motifDetail);

        return [
            'applied_count'         => $rotations->count(),
            'skipped_locked'        => $preview['meta']['locked_skipped'] ?? 0,
            'headquarters_rotation' => null,
            'rotations'             => $rotations->all(),
        ];
    }

    /**
     * Cancel with cascade — handles HEADQUARTERS, FILL, GAP modes.
     *
     * Returns CascadeResult.
     */
    public function cancel(null $root, array $args): array
    {
        $rotation    = Rotation::with(['member', 'house'])->findOrFail($args['id']);
        $mode        = $args['mode'];
        $motif       = $args['motif'];
        $motifDetail = $args['motif_detail'] ?? null;

        if (in_array($rotation->status, ['completed', 'cancelled'])) {
            throw new Error('Ce tour est déjà effectué ou annulé.');
        }

        return $this->cascade->cancelWithMode($rotation, strtolower($mode), $motif, $motifDetail);
    }
}
