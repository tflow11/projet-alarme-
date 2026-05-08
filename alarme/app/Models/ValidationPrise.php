<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ValidationPrise extends Model
{
    use HasFactory;

    // Nom de la table dans la base de données
    protected $table = 'validation_prises';

    // Les colonnes que l'on peut remplir via le contrôleur
    protected $fillable = [
        'id_traitement',
        'prise_numero',
        'date_validation'
    ];

    /**
     * Relation : Une validation appartient à un traitement
     */
    public function traitement()
    {
        return $this->belongsTo(Traitement::class, 'id_traitement');
    }
}