<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventCategoryAmount extends Model
{
    protected $fillable = ['event_id', 'member_category_id', 'amount'];

    protected $casts = ['amount' => 'decimal:2'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(DahiraEvent::class, 'event_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MemberCategory::class, 'member_category_id');
    }
}
