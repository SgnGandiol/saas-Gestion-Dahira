<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class House extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }
    protected $fillable = [
        'dahira_id', 'label', 'address',
        'neighborhood', 'latitude', 'longitude',
        'capacity', 'is_available', 'is_headquarters', 'min_interval_weeks',
        'total_received', 'last_received_at',
    ];

    protected $casts = [
        'is_available'    => 'boolean',
        'is_headquarters' => 'boolean',
        'latitude'        => 'decimal:7',
        'longitude'       => 'decimal:7',
        'last_received_at' => 'date',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function rotations(): HasMany
    {
        return $this->hasMany(Rotation::class);
    }

    public function lastRotation(): HasMany
    {
        return $this->hasMany(Rotation::class)->latest('scheduled_date')->limit(1);
    }
}
