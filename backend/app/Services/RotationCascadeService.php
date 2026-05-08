<?php

namespace App\Services;

use App\Models\House;
use App\Models\Rotation;
use Carbon\Carbon;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RotationCascadeService
{
    private const LOCK_DAYS = 14;

    public function __construct(
        private readonly RotationLogService $logger
    ) {}

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Dry-run: returns a diff without touching the DB.
     */
    public function previewCascade(Rotation $rotation, string $mode, int $shiftWeeks = 1): array
    {
        $lockCutoff = Carbon::today()->addDays(self::LOCK_DAYS)->toDateString();

        return match (strtolower($mode)) {
            'chain' => $this->previewChain($rotation, $shiftWeeks, $lockCutoff),
            'swap'  => $this->previewSwap($rotation, $lockCutoff),
            'fill'  => $this->previewFill($rotation, $lockCutoff),
            default => $this->emptyPreview($mode),
        };
    }

    /**
     * Applies a preview in a single transaction.
     */
    public function applyCascade(array $preview, string $motif, ?string $motifDetail): Collection
    {
        $rotations = collect();

        DB::transaction(function () use ($preview, $motif, $motifDetail, &$rotations) {
            foreach ($preview['items'] as $item) {
                if ($item['is_locked'] || $item['old_date'] === $item['new_date']) {
                    continue;
                }

                $rotation = Rotation::findOrFail($item['rotation_id']);
                $rotation->update(['scheduled_date' => $item['new_date']]);

                $this->logger->logChange($rotation, 'cascade_applied', [
                    'mode'         => $preview['meta']['mode'],
                    'motif'        => $motif,
                    'motif_detail' => $motifDetail,
                    'old_date'     => $item['old_date'],
                    'new_date'     => $item['new_date'],
                ]);

                $rotations->push($rotation->fresh(['member', 'house']));
            }
        });

        return $rotations;
    }

    /**
     * Moves a single rotation to a new date (GAP — no cascade).
     */
    public function applyGap(Rotation $rotation, string $newDate, string $motif, ?string $motifDetail): Rotation
    {
        DB::transaction(function () use ($rotation, $newDate, $motif, $motifDetail) {
            $oldDate = $rotation->scheduled_date;
            $rotation->update([
                'scheduled_date' => $newDate,
                'status'         => $rotation->status === 'planned' ? 'rescheduled' : $rotation->status,
            ]);
            $this->logger->logChange($rotation, 'rescheduled', [
                'motif'        => $motif,
                'motif_detail' => $motifDetail,
                'mode'         => 'GAP',
                'old_date'     => $oldDate,
                'new_date'     => $newDate,
            ]);
        });

        return $rotation->fresh(['member', 'house']);
    }

    /**
     * Converts a rotation to a headquarters session (status + house change, no date change).
     */
    public function convertToHeadquarters(Rotation $rotation, string $motif, ?string $motifDetail): Rotation
    {
        $hq = House::where('dahira_id', $rotation->dahira_id)
            ->where('is_headquarters', true)
            ->first();

        if (! $hq) {
            throw new Error(
                "Aucune maison siège configurée. Activez « Est le siège » sur une maison dans la page Maisons."
            );
        }

        DB::transaction(function () use ($rotation, $hq, $motif, $motifDetail) {
            $rotation->update([
                'house_id' => $hq->id,
                'status'   => 'headquarters',
                'notes'    => $motifDetail ?: $motif,
            ]);
            $this->logger->logChange($rotation, 'converted_to_headquarters', [
                'motif'        => $motif,
                'motif_detail' => $motifDetail,
                'hq_house_id'  => $hq->id,
                'hq_label'     => $hq->label ?: $hq->address,
            ]);
        });

        return $rotation->fresh(['member', 'house']);
    }

    /**
     * Cancels a rotation with optional cascade effect.
     *
     * Modes:
     *  - headquarters : convert instead of cancelling
     *  - fill         : cancel + advance subsequent rotations -1 week
     *  - gap          : cancel only
     */
    public function cancelWithMode(Rotation $rotation, string $mode, string $motif, ?string $motifDetail): array
    {
        $mode = strtolower($mode);

        if ($mode === 'headquarters') {
            $hqRotation = $this->convertToHeadquarters($rotation, $motif, $motifDetail);
            return [
                'applied_count'         => 0,
                'skipped_locked'        => 0,
                'headquarters_rotation' => $hqRotation,
                'rotations'             => [$hqRotation],
            ];
        }

        $lockCutoff = Carbon::today()->addDays(self::LOCK_DAYS)->toDateString();
        $cascaded   = collect();
        $skipped    = 0;

        DB::transaction(function () use ($rotation, $mode, $motif, $motifDetail, $lockCutoff, &$cascaded, &$skipped) {
            $rotation->update(['status' => 'cancelled']);
            $this->logger->logChange($rotation, 'cancelled', [
                'motif'        => $motif,
                'motif_detail' => $motifDetail,
                'mode'         => strtoupper($mode),
            ]);

            if ($mode === 'fill') {
                $preview = $this->previewFill($rotation, $lockCutoff);
                $skipped = $preview['meta']['locked_skipped'];
                // Apply within the same transaction
                foreach ($preview['items'] as $item) {
                    if ($item['is_locked'] || $item['old_date'] === $item['new_date']) {
                        continue;
                    }
                    $r = Rotation::findOrFail($item['rotation_id']);
                    $r->update(['scheduled_date' => $item['new_date']]);
                    $this->logger->logChange($r, 'cascade_applied', [
                        'mode'         => 'FILL',
                        'motif'        => $motif,
                        'motif_detail' => $motifDetail,
                        'old_date'     => $item['old_date'],
                        'new_date'     => $item['new_date'],
                    ]);
                    $cascaded->push($r->fresh(['member', 'house']));
                }
            }
        });

        return [
            'applied_count'         => $cascaded->count(),
            'skipped_locked'        => $skipped,
            'headquarters_rotation' => null,
            'rotations'             => $cascaded->all(),
        ];
    }

    /**
     * Inserts a new rotation at $date, cascading existing planned rotations +1 week.
     * Returns the IDs of shifted rotations (the actual creation is handled by RotationMutation).
     */
    public function insertShift(Rotation $existingAtDate, string $motif, ?string $motifDetail): int
    {
        $lockCutoff = Carbon::today()->addDays(self::LOCK_DAYS)->toDateString();
        $preview    = $this->previewChain($existingAtDate, 1, $lockCutoff);
        $shifted    = $this->applyCascade($preview, $motif ?? 'INSERT', $motifDetail);
        return $shifted->count();
    }

    // ── Private preview builders ─────────────────────────────────────

    private function previewChain(Rotation $fromRotation, int $shiftWeeks, string $lockCutoff): array
    {
        $shiftDays = $shiftWeeks * 7;
        $chain     = $this->getChainFrom($fromRotation);

        // Include the from_rotation itself as the first item
        $all           = collect([$fromRotation])->merge($chain);
        $existingDates = $all->pluck('scheduled_date')->toArray();
        $usedDates     = [];
        $items         = [];
        $lockedCount   = 0;

        foreach ($all as $rotation) {
            $oldDate  = $rotation->scheduled_date;
            $newDate  = Carbon::parse($oldDate)->addDays($shiftDays)->toDateString();
            $isLocked = $oldDate <= $lockCutoff;

            // Resolve date conflicts
            while (in_array($newDate, $usedDates) || (in_array($newDate, $existingDates) && $newDate !== $oldDate)) {
                $newDate = Carbon::parse($newDate)->addDays(7)->toDateString();
            }
            $usedDates[] = $newDate;

            if ($isLocked) {
                $lockedCount++;
            }

            $items[] = [
                'rotation_id' => (string) $rotation->id,
                'member_name' => $rotation->member?->full_name,
                'house_label' => $rotation->house?->label ?: $rotation->house?->address,
                'old_date'    => $oldDate,
                'new_date'    => $isLocked ? $oldDate : $newDate,
                'is_locked'   => $isLocked,
            ];
        }

        $changed = collect($items)->filter(fn ($i) => $i['old_date'] !== $i['new_date'])->count();

        return [
            'items' => $items,
            'meta'  => [
                'mode'           => 'CHAIN',
                'total_affected' => $changed,
                'locked_skipped' => $lockedCount,
                'shift_weeks'    => $shiftWeeks,
            ],
            'has_locked_warning' => $lockedCount > 0,
        ];
    }

    private function previewSwap(Rotation $fromRotation, string $lockCutoff): array
    {
        $next = Rotation::where('dahira_id', $fromRotation->dahira_id)
            ->whereIn('status', ['planned', 'confirmed'])
            ->where('scheduled_date', '>', $fromRotation->scheduled_date)
            ->orderBy('scheduled_date')
            ->with(['member', 'house'])
            ->first();

        if (! $next) {
            return $this->emptyPreview('SWAP');
        }

        $aLocked = $fromRotation->scheduled_date <= $lockCutoff;
        $bLocked = $next->scheduled_date <= $lockCutoff;

        return [
            'items' => [
                [
                    'rotation_id' => (string) $fromRotation->id,
                    'member_name' => $fromRotation->member?->full_name,
                    'house_label' => $fromRotation->house?->label ?: $fromRotation->house?->address,
                    'old_date'    => $fromRotation->scheduled_date,
                    'new_date'    => $next->scheduled_date,
                    'is_locked'   => $aLocked,
                ],
                [
                    'rotation_id' => (string) $next->id,
                    'member_name' => $next->member?->full_name,
                    'house_label' => $next->house?->label ?: $next->house?->address,
                    'old_date'    => $next->scheduled_date,
                    'new_date'    => $fromRotation->scheduled_date,
                    'is_locked'   => $bLocked,
                ],
            ],
            'meta' => [
                'mode'           => 'SWAP',
                'total_affected' => 2,
                'locked_skipped' => ($aLocked ? 1 : 0) + ($bLocked ? 1 : 0),
                'shift_weeks'    => null,
            ],
            'has_locked_warning' => $aLocked || $bLocked,
        ];
    }

    private function previewFill(Rotation $fromRotation, string $lockCutoff): array
    {
        $chain     = $this->getChainFrom($fromRotation);
        $today     = Carbon::today()->toDateString();
        $items     = [];
        $locked    = 0;

        foreach ($chain as $rotation) {
            $oldDate  = $rotation->scheduled_date;
            $newDate  = Carbon::parse($oldDate)->subDays(7)->toDateString();
            $isLocked = $oldDate <= $lockCutoff;

            if ($newDate < $today) {
                break;
            }

            if ($isLocked) {
                $locked++;
            }

            $items[] = [
                'rotation_id' => (string) $rotation->id,
                'member_name' => $rotation->member?->full_name,
                'house_label' => $rotation->house?->label ?: $rotation->house?->address,
                'old_date'    => $oldDate,
                'new_date'    => $isLocked ? $oldDate : $newDate,
                'is_locked'   => $isLocked,
            ];
        }

        $changed = collect($items)->filter(fn ($i) => $i['old_date'] !== $i['new_date'])->count();

        return [
            'items' => $items,
            'meta'  => [
                'mode'           => 'FILL',
                'total_affected' => $changed,
                'locked_skipped' => $locked,
                'shift_weeks'    => -1,
            ],
            'has_locked_warning' => $locked > 0,
        ];
    }

    private function emptyPreview(string $mode): array
    {
        return [
            'items' => [],
            'meta'  => [
                'mode'           => strtoupper($mode),
                'total_affected' => 0,
                'locked_skipped' => 0,
                'shift_weeks'    => null,
            ],
            'has_locked_warning' => false,
        ];
    }

    private function getChainFrom(Rotation $rotation): Collection
    {
        return Rotation::where('dahira_id', $rotation->dahira_id)
            ->whereIn('status', ['planned', 'confirmed'])
            ->where('scheduled_date', '>', $rotation->scheduled_date)
            ->orderBy('scheduled_date')
            ->with(['member', 'house'])
            ->get();
    }
}
