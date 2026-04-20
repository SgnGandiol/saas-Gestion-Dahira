<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }
    protected $fillable = [
        'dahira_id', 'user_id', 'label',
        'category', 'amount', 'spent_at', 'notes',
    ];

    protected $casts = [
        'amount'   => 'decimal:2',
        'spent_at' => 'date',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
