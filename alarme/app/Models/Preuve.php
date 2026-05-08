<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Preuve extends Model
{
    use HasFactory;

    protected $fillable = [
        'prise_id',
        'image',
        'date_validation'
    ];

    public function prise()
    {
        return $this->belongsTo(Prise::class);
    }
}