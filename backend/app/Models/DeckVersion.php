<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DeckVersion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'deck_id',
        'version_name',
    ];

    public function deck()
    {
        return $this->belongsTo(Deck::class);
    }

    public function cards()
    {
        return $this->hasMany(DeckCard::class);
    }
}
