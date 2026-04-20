<?php

namespace App\GraphQL\Mutations;

use App\Models\Assignment;

final class AssignmentMutation
{
    public function toggle(null $root, array $args): Assignment
    {
        $assignment = Assignment::findOrFail($args['id']);
        $assignment->update(['completed' => ! $assignment->completed]);
        return $assignment->fresh();
    }
}
