<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Prise;
use App\Models\Stock;
use App\Models\Preuve;

class PriseController extends Controller
{
    public function validerPrise(Request $request)
    {
        $prise = Prise::find($request->prise_id);

        if (!$prise) {
            return response()->json(['error' => 'Prise non trouvée'], 404);
        }

        // 📸 Enregistrer image
        $imagePath = $request->file('image')->store('preuves', 'public');

        $preuve = Preuve::create([
            'prise_id' => $prise->id,
            'image' => $imagePath,
            'date_validation' => now(),
        ]);

        // 📦 Mise à jour stock
        $stock = Stock::where('medicament_id', $prise->traitement->medicament_id)->first();

        if ($stock) {
            $stock->nombre_restant -= $prise->quantite;
            $stock->save();

            // ⚠️ Alerte si <= 5
            if ($stock->nombre_restant <= 5) {
                // ici tu peux envoyer notification
            }
        }

        return response()->json([
            'message' => 'Prise validée',
            'preuve' => $preuve
        ]);
    }
}
