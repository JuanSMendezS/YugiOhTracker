<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ListingItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'listing_id',
        'card_print_id',
        'quantity',
    ];

    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }

    public function cardPrint()
    {
        return $this->belongsTo(CardPrint::class);
    }
}
