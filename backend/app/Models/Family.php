<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Family extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    protected $fillable = [
        'dahira_id', 'name', 'address', 'neighborhood',
        'phone', 'capacity', 'is_available',
        'total_received', 'last_received_at',
    ];

    protected $casts = [
        'is_available'    => 'boolean',
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

    public function house(): HasOne
    {
        return $this->hasOne(House::class);
    }
}
