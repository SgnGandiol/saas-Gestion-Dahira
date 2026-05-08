<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DahiraEvent extends Model
{
    protected $table = 'events';

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    protected $fillable = [
        'dahira_id', 'name', 'type', 'target_amount',
        'deadline', 'color', 'status', 'description',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'deadline'      => 'date',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function categoryAmounts(): HasMany
    {
        return $this->hasMany(EventCategoryAmount::class, 'event_id');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class, 'event_id');
    }

    public function getTotalCollected(): float
    {
        return (float) $this->contributions()
            ->whereIn('status', ['paid', 'partial'])
            ->sum('amount');
    }

    public function getMembersCountAttribute(): int
    {
        return $this->contributions()
            ->whereIn('status', ['paid', 'partial'])
            ->distinct('member_id')
            ->count('member_id');
    }
}
