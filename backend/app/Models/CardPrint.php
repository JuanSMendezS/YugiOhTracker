<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CardPrint extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'card_id',
        'set_id',
        'rarity',
        'rarity_code',
        'print_code',
        'price_tcgplayer',
        'price_cardmarket',
        'image_url',
    ];

    public function card()
    {
        return $this->belongsTo(Card::class);
    }

    public function set()
    {
        return $this->belongsTo(Set::class);
    }

    public function listings()
    {
        return $this->hasMany(Listing::class);
    }
}
