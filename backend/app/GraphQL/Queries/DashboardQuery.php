<?php

namespace App\GraphQL\Queries;

use App\Models\Contribution;
use App\Models\Expense;
use App\Models\House;
use App\Models\Member;
use App\Models\Rotation;
use Carbon\Carbon;

final class DashboardQuery
{
    public function stats(null $root, array $args): array
    {
        $dahiraId = (int) $args['dahira_id'];
        $now      = Carbon::now();

        $activeMembersCount = Member::where('dahira_id', $dahiraId)
            ->where('is_active', true)
            ->count();

        $housesCount = House::where('dahira_id', $dahiraId)->count();

        $nextRotation = Rotation::where('dahira_id', $dahiraId)
            ->whereIn('status', ['planned', 'confirmed'])
            ->where('scheduled_date', '>=', $now->toDateString())
            ->orderBy('scheduled_date')
            ->with(['house'])
            ->first();

        $monthlyContributions = Contribution::where('dahira_id', $dahiraId)
            ->whereYear('paid_at', $now->year)
            ->whereMonth('paid_at', $now->month)
            ->sum('amount');

        $monthlyExpenses = Expense::where('dahira_id', $dahiraId)
            ->whereYear('spent_at', $now->year)
            ->whereMonth('spent_at', $now->month)
            ->sum('amount');

        return [
            'active_members_count'   => $activeMembersCount,
            'houses_count'           => $housesCount,
            'next_rotation'          => $nextRotation,
            'monthly_contributions'  => (float) $monthlyContributions,
            'monthly_expenses'       => (float) $monthlyExpenses,
            'balance'                => (float) $monthlyContributions - (float) $monthlyExpenses,
        ];
    }
}
