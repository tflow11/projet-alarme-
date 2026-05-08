<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Traitement;
use App\Models\Patient;
use App\Models\Medicament;
use Carbon\Carbon;

class TraitementController extends Controller
{
    public function index(Request $request)
    {
        $id_medecin = $request->query('id_medecin');

        $traitements = DB::table('traitements')
            ->join('patients', 'traitements.id_patient', '=', 'patients.id')
            ->join('medicaments', 'traitements.id_medicament', '=', 'medicaments.id')
            ->where('traitements.id_medecin', $id_medecin)
            ->select(
                'traitements.*',
                'patients.nom as patient_nom',
                'patients.prenom as patient_prenom',
                'medicaments.nom as medicament_nom',
                'medicaments.quantite as stock_restant',
                'medicaments.unite as unite_med'
            )
            ->orderBy('traitements.id', 'desc')
            ->get();

        foreach ($traitements as $t) {
            $t->scans_du_jour = DB::table('validation_prises')
                ->where('id_traitement', $t->id)
                ->whereDate('date_validation', Carbon::today())
                ->get();
            
            // On ajoute un booléen simple pour React
            $t->is_valid = $t->scans_du_jour->count() > 0;
            $t->date_validation = $t->is_valid ? $t->scans_du_jour->first()->date_validation : null;
        }

        return response()->json($traitements);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_patient'    => 'required',
            'id_medicament' => 'required',
            'id_medecin'    => 'required',
            'date_debut'    => 'required|date',
            'duree'         => 'required|integer',
            'heure1'        => 'required',
            'qte1'          => 'required|numeric',
     
        ]);

        try {
            $traitement = Traitement::create($data);
            return response()->json(['success' => true, 'data' => $traitement]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // --- FONCTION DE SUPPRESSION CORRIGÉE ---
    public function destroy($id)
    {
        try {
            return DB::transaction(function () use ($id) {
                // 1. Supprimer les validations enfants d'abord
                DB::table('validation_prises')->where('id_traitement', $id)->delete();
                
                // 2. Supprimer le traitement parent
                $deleted = DB::table('traitements')->where('id', $id)->delete();

                if ($deleted) {
                    return response()->json(['message' => 'Supprimé avec succès'], 200);
                }
                return response()->json(['error' => 'Non trouvé'], 404);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function dependencies() {
        return response()->json([
            'patients' => Patient::all(),
            'medicaments' => Medicament::all()
        ]);
    }
}