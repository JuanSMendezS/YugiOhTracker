<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Listing extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'card_print_id',
        'asset_type',
        'title',
        'description',
        'price',
        'currency',
        'quantity',
        'status',
        'condition',
        'language',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cardPrint()
    {
        return $this->belongsTo(CardPrint::class);
    }

    public function items()
    {
        return $this->hasMany(ListingItem::class);
    }

    public function images()
    {
        return $this->hasMany(ListingImage::class);
    }
}
