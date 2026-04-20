<?php

namespace App\Models\Scopes;

use App\Services\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // super_admin bypasses all tenant scoping
        if (Auth::check() && Auth::user()->hasRole('super_admin')) {
            return;
        }

        /** @var TenantManager $manager */
        $manager = app(TenantManager::class);

        // Lazy resolution from authenticated user if middleware hasn't set it yet
        if (! $manager->resolved() && Auth::check()) {
            $user = Auth::user();
            // Guard against orphaned dahira_id (soft-deleted dahira)
            if ($user->dahira_id && $user->dahira !== null) {
                $manager->set($user->dahira);
            }
        }

        if ($manager->resolved()) {
            $builder->where($model->getTable() . '.dahira_id', $manager->id());
        }
    }
}
