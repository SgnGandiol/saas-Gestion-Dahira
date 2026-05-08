<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contribution extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }
    protected $fillable = [
        'dahira_id', 'member_id', 'event_id', 'type',
        'amount', 'paid_at', 'period', 'status', 'notes',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'date',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(DahiraEvent::class, 'event_id');
    }
}
