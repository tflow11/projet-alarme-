<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Medecin;
use App\Models\Patient; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MedecinController extends Controller
{
   public function storePatient(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nom'      => 'required|string|max:255',
        'prenom'   => 'required|string|max:255', // Ajout du prénom
        'email'    => 'required|email|unique:patients,email',
        'password' => 'required|min:6',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $patient = Patient::create([
        'nom'      => $request->nom,
        'prenom'   => $request->prenom,
        'email'    => $request->email,
        'password' => Hash::make($request->password),
    ]);

    return response()->json(['message' => 'Patient créé avec succès', 'patient' => $patient], 201);
}

    public function login(Request $request)
    {
        $medecin = Medecin::where('email', $request->email)->first();
        if (!$medecin || !Hash::check($request->password, $medecin->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }
        return response()->json(['message' => 'Connexion réussie', 'medecin' => $medecin]);
    }

    public function index() { return response()->json(Medecin::all(), 200); }
}