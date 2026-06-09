<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Traitement;
use App\Models\Medicament;
use App\Models\ValidationPrise;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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

    // Récupérer les traitements d'un patient avec les validations du jour
    public function getTraitementsPatient($id) {
        try {
            // 1. Récupérer les traitements avec jointures
            $traitements = DB::table('traitements')
                ->join('medicaments', 'traitements.id_medicament', '=', 'medicaments.id')
                ->join('medecins', 'traitements.id_medecin', '=', 'medecins.id')
                ->where('traitements.id_patient', $id)
                ->select(
                    'traitements.*',
                    'medicaments.nom as medicament_nom',
                    'medicaments.quantite as stock_restant',
                    'medicaments.unite as unite_med',
                    'medicaments.code_barre',
                    'medecins.nom as medecin_nom'
                )
                ->get();

            // 2. Récupérer les validations du jour pour chaque traitement
            $aujourdhui = Carbon::today();
            
            foreach ($traitements as $t) {
                $validations = ValidationPrise::where('id_traitement', $t->id)
                    ->whereDate('date_validation', $aujourdhui)
                    ->get();
                
                $t->is_valid = $validations->count() > 0;
                $t->prises_du_jour = $validations;
            }

            return response()->json([
                'traitements' => $traitements,
                'prises_du_jour' => []
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Vérification du code-barres
    private function verifierCodeBarre($medicamentId, $codeScanne)
    {
        $medicament = Medicament::find($medicamentId);
        
        if (!$medicament || empty($medicament->code_barre)) {
            return false;
        }
        
        return trim($codeScanne) === trim($medicament->code_barre);
    }

    // Validation d'une prise avec vérification scan
    public function validerPrise(Request $request)
    {
        try {
            \Log::info('Validation requête reçue', $request->all());
            
            // 1. Trouver le traitement
            $traitement = Traitement::find($request->id_traitement);

            if (!$traitement) {
                return response()->json(['error' => 'Traitement non trouvé'], 404);
            }

            // 2. Vérification du code-barres (si ce n'est pas une validation manuelle)
            $codeScanne = $request->code_scanne;
            
            if ($codeScanne && $codeScanne !== 'MANUEL') {
                $codeValide = $this->verifierCodeBarre($traitement->id_medicament, $codeScanne);
                
                if (!$codeValide) {
                    return response()->json([
                        'error' => 'Code-barres invalide. Veuillez scanner le bon médicament.'
                    ], 403);
                }
            }

            // 3. Déterminer la quantité
            $num = filter_var($request->prise_numero, FILTER_SANITIZE_NUMBER_INT);
            $colonneQte = 'qte' . $num;
            $quantiteADeduire = $traitement->$colonneQte ?? 1;

            // 4. Vérifier si déjà validé aujourd'hui
            $dejaValide = ValidationPrise::where('id_traitement', $traitement->id)
                ->where('prise_numero', $request->prise_numero)
                ->whereDate('date_validation', Carbon::today())
                ->exists();
                
            if ($dejaValide) {
                return response()->json(['error' => 'Cette prise a déjà été validée aujourd\'hui'], 409);
            }

            // 5. Enregistrer la validation
            ValidationPrise::create([
                'id_traitement'   => $traitement->id,
                'prise_numero'    => $request->prise_numero,
                'date_validation' => Carbon::now(),
            ]);

            // 6. Déduire du stock
            $medicament = Medicament::find($traitement->id_medicament);
            if ($medicament) {
                $medicament->quantite -= $quantiteADeduire;
                $medicament->save();
            }

            return response()->json([
                'success' => true,
                'message' => "Prise validée avec succès. $quantiteADeduire unités déduites.",
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur validation prise: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }
}