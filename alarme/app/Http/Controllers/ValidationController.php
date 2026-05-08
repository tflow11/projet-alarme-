<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ValidationPrise;

class ValidationController extends Controller
{
   public function store(Request $request)
{
    $validation = new ValidationPrise();
    $validation->id_traitement = $request->id_traitement;
    $validation->prise_numero = $request->prise_numero;
    
    // On enregistre l'heure actuelle (ex: 14:05)
    // Assure-toi que cette colonne existe bien dans ta table 'validation_prises'
    $validation->date_validation = now()->format('H:i'); 
    
    $validation->save();

    return response()->json([
        'message' => 'Prise enregistrée avec succès',
        'heure_reelle' => $validation->date_validation // On renvoie l'heure pour vérification
    ]);
}
}