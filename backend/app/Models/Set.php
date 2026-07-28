<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Set extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
    ];

    public function prints()
    {
        return $this->hasMany(CardPrint::class);
    }
}
