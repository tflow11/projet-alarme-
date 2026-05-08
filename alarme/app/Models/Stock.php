<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicament_id',
        'nombre_total',
        'nombre_restant'
    ];

    public function medicament()
    {
        return $this->belongsTo(Medicament::class);
    }
}