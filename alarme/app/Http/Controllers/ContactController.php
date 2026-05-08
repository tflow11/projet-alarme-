<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contact;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    public function index()
    {
        $rdvs = Contact::orderBy('date_rdv', 'desc')->get();
        return response()->json($rdvs);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom'          => 'required|string|max:255',
            'telephone'    => 'required|string|max:20',
            'date'         => 'required|date', 
            'nom_medecin'  => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $contact = new Contact();
            $contact->nom_client  = $request->nom;
            $contact->telephone   = $request->telephone;
            $contact->date_rdv    = $request->date;
            $contact->nom_medecin = $request->nom_medecin;
            $contact->sujet       = "Demande de RDV: " . $request->motif;
            $contact->message     = "Demande reçue via la page Contact.";
            $contact->statut      = "En attente";
            $contact->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Demande envoyée avec succès au ' . $request->nom_medecin
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur SQL : ' . $e->getMessage()
            ], 500);
        }
    }

    public function valider($id)
    {
        try {
            $rdv = Contact::findOrFail($id);
            $rdv->statut = "Confirmé";
            $rdv->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Rendez-vous validé !'
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Erreur de validation.'], 500);
        }
    }

    // FONCTION CORRIGÉE : PLUS D'ÉTOILES ICI
    public function rdvConfirmes()
    {
        $confirmes = Contact::where('statut', 'Confirmé')
            ->select('nom_client', 'date_rdv', 'nom_medecin')
            ->orderBy('date_rdv', 'asc') 
            ->get(); 

        return response()->json($confirmes);
    }
}


