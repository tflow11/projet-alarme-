<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Prise extends Model
{
    use HasFactory;

    protected $fillable = [
        'traitement_id',
        'heure',
        'quantite'
    ];

    public function traitement()
    {
        return $this->belongsTo(Traitement::class);
    }

    public function preuve()
    {
        return $this->hasOne(Preuve::class);
    }
}