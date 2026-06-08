<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    // Assure-toi que ces colonnes sont autorisées
    protected $fillable = [
    'nom_client', 
    'telephone', 
    'date_rdv', 
    'nom_medecin', 
    'message', 
    'statut'
];
}