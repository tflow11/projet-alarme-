<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Traitement extends Model
{
    protected $fillable = [
        'id_patient', 'id_medicament', 'id_medecin', 
        'date_debut', 'duree',
        'heure1', 'qte1', 
        'heure2', 'qte2', 
        'heure3', 'qte3'
    ];
}