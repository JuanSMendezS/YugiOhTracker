<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Card extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'type',
        'frame_type',
        'description',
        'atk',
        'def',
        'level',
        'race',
        'attribute',
        'archetype',
    ];

    public function prints()
    {
        return $this->hasMany(CardPrint::class);
    }
}
