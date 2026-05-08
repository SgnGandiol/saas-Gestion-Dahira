<?php

namespace App\GraphQL\Mutations;

use App\Models\DahiraEvent;
use App\Models\EventCategoryAmount;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

final class EventMutation
{
    public function create(null $root, array $args): DahiraEvent
    {
        return DB::transaction(function () use ($args) {
            $event = DahiraEvent::create([
                'dahira_id'     => $args['dahira_id'],
                'name'          => $args['name'],
                'type'          => $args['type'],
                'target_amount' => $args['target_amount'] ?? null,
                'deadline'      => $args['deadline'] ?? null,
                'color'         => $args['color'] ?? '#8b5cf6',
                'description'   => $args['description'] ?? null,
                'status'        => 'active',
            ]);

            foreach ($args['category_amounts'] ?? [] as $ca) {
                EventCategoryAmount::create([
                    'event_id'           => $event->id,
                    'member_category_id' => $ca['member_category_id'],
                    'amount'             => $ca['amount'],
                ]);
            }

            return $event->load('categoryAmounts.category');
        });
    }

    public function update(null $root, array $args): DahiraEvent
    {
        $event = DahiraEvent::findOrFail($args['id']);

        return DB::transaction(function () use ($event, $args) {
            $event->update(array_filter([
                'name'          => $args['name'] ?? null,
                'type'          => $args['type'] ?? null,
                'target_amount' => array_key_exists('target_amount', $args) ? $args['target_amount'] : null,
                'deadline'      => array_key_exists('deadline', $args) ? $args['deadline'] : null,
                'color'         => $args['color'] ?? null,
                'description'   => $args['description'] ?? null,
            ], fn($v) => $v !== null));

            if (isset($args['category_amounts'])) {
                $event->categoryAmounts()->delete();
                foreach ($args['category_amounts'] as $ca) {
                    EventCategoryAmount::create([
                        'event_id'           => $event->id,
                        'member_category_id' => $ca['member_category_id'],
                        'amount'             => $ca['amount'],
                    ]);
                }
            }

            return $event->fresh(['categoryAmounts.category']);
        });
    }

    public function close(null $root, array $args): DahiraEvent
    {
        $event = DahiraEvent::findOrFail($args['id']);

        if ($event->status === 'closed') {
            throw new Error('Cet événement est déjà clôturé.');
        }

        $event->update(['status' => 'closed']);

        return $event->fresh();
    }

    public function delete(null $root, array $args): DahiraEvent
    {
        $event = DahiraEvent::findOrFail($args['id']);
        $event->delete();
        return $event;
    }
}
