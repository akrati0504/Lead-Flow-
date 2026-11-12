<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    /**
     * The allowable statuses for a lead.
     */
    public const STATUS_NEW = 'new';
    public const STATUS_CONTACTED = 'contacted';
    public const STATUS_INTERESTED = 'interested';
    public const STATUS_CONVERTED = 'converted';
    public const STATUS_LOST = 'lost';

    public const ALLOWED_STATUSES = [
        self::STATUS_NEW,
        self::STATUS_CONTACTED,
        self::STATUS_INTERESTED,
        self::STATUS_CONVERTED,
        self::STATUS_LOST,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'customer_name',
        'phone',
        'email',
        'company_name',
        'description',
        'status',
        'assigned_to',
        'created_by',
    ];

    /**
     * The employee assigned to this lead.
     */
    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * The user who created this lead.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Follow-ups associated with this lead.
     */
    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class, 'lead_id');
    }
}

