<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    protected $fillable = [
        'dahira_id', 'house_id', 'member_category_id', 'user_id',
        'first_name', 'last_name', 'phone', 'email',
        'gender', 'profession', 'joined_at',
        'is_active', 'notes', 'photo_url',
        'availability_status', 'absence_frequency', 'priority_score',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'joined_at'         => 'date',
        'absence_frequency' => 'integer',
        'priority_score'    => 'float',
    ];

    public function dahira(): BelongsTo
    {
        return $this->belongsTo(Dahira::class);
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MemberCategory::class, 'member_category_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
