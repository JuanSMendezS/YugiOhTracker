<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DeckCard extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'deck_version_id',
        'card_id',
        'quantity',
        'section',
    ];

    public function deckVersion()
    {
        return $this->belongsTo(DeckVersion::class);
    }

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
