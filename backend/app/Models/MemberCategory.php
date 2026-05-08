<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberCategory extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    protected $fillable = [
        'dahira_id', 'name', 'label', 'weekly_amount', 'color', 'is_default', 'sort_order',
    ];

    protected $casts = [
        'weekly_amount' => 'decimal:2',
        'is_default'    => 'boolean',
        'sort_order'    => 'integer',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }
}
