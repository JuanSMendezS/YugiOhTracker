<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CollectionItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'collection_id',
        'card_print_id',
        'quantity',
        'condition',
        'language',
        'is_foil',
        'notes',
    ];

    protected $casts = [
        'is_foil' => 'boolean',
    ];

    public function collection()
    {
        return $this->belongsTo(Collection::class);
    }

    public function cardPrint()
    {
        return $this->belongsTo(CardPrint::class);
    }
}
