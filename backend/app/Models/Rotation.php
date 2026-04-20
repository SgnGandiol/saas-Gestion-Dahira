<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rotation extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }
    protected $fillable = [
        'dahira_id', 'house_id', 'scheduled_date',
        'status', 'attendees_count', 'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
