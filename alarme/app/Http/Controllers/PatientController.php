<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Traitement;
use App\Models\Medicament;
use App\Models\ValidationPrise;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PatientController extends Controller
{
    // Connexion
    public function login(Request $request) {
        $patient = Patient::where('email', $request->email)->first();
        if (!$patient || !Hash::check($request->password, $patient->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }
        return response()->json(['patient' => $patient], 200);
    }

    public function getTraitementsPatient($id) {
        try {
            $traitements = Traitement::where('id_patient', $id)
                ->join('medicaments', 'traitements.id_medicament', '=', 'medicaments.id')
                ->join('medecins', 'traitements.id_medecin', '=', 'medecins.id')
                ->select(
                    'traitements.id as id', 
                    'traitements.*', 
                    'medicaments.nom as medicament_nom', 
                    'medicaments.quantite as stock_restant',
                    'medicaments.unite as unite_med', 
                    'medecins.nom as medecin_nom'
                )
                ->get();

            return response()->json($traitements);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Enregistrer la validation du patient
    public function validerPrise(Request $request)
    {
        try {
            // 1. Trouver le traitement
            $traitement = Traitement::find($request->id_traitement);

            if (!$traitement) {
                return response()->json(['error' => 'Traitement non trouvé'], 404);
            }

            // 2. Déterminer quelle quantité déduire
            $num = filter_var($request->prise_numero, FILTER_SANITIZE_NUMBER_INT);
            $colonneQte = 'qte' . $num; 
            $quantiteADeduire = $traitement->$colonneQte ?? 1;

            // 3. Récupérer l'heure de validation envoyée par le frontend
            // Si le front ne l'envoie pas, on prend l'heure actuelle
            $heureValidation = $request->heure_validation ?? now()->format('H:i');

            // 4. Enregistrer dans l'historique des validations
            ValidationPrise::create([
                'id_traitement'   => $request->id_traitement,
                'prise_numero'    => $request->prise_numero,
                'date_validation' => now(), 
                // Assurez-vous que votre table validation_prises a aussi cette colonne si vous voulez l'historique complet
                'heure_clic'      => $heureValidation 
            ]);

            // 5. Mise à jour du traitement pour le Dashboard Médecin
            // On met à jour l'heure_validation pour que le médecin la voie
            $traitement->update([
                'is_valid' => true,
                'heure_validation' => $heureValidation
            ]);

            // 6. Déduire du stock de médicaments
            Medicament::where('id', $traitement->id_medicament)
                ->decrement('quantite', $quantiteADeduire);

            return response()->json([
                'message' => "Prise validée à $heureValidation. $quantiteADeduire unités déduites.",
                'heure'   => $heureValidation
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur Serveur',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}