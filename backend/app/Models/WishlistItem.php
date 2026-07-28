<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WishlistItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'wishlist_id',
        'card_id',
        'priority',
        'target_price',
        'notes',
    ];

    public function wishlist()
    {
        return $this->belongsTo(Wishlist::class);
    }

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
