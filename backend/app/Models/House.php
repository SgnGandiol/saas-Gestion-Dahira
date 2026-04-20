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
        'dahira_id', 'family_id', 'label', 'address',
        'neighborhood', 'latitude', 'longitude',
        'capacity', 'is_available', 'min_interval_weeks',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'latitude'     => 'decimal:7',
        'longitude'    => 'decimal:7',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
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
