<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MedicamentSeeder extends Seeder
{
    public function run(): void
    {
        // Nettoyage de la table pour repartir à zéro
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('medicaments')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        DB::table('medicaments')->insert([
            [
                'nom' => 'Doliprane 1000mg',
                'code_barre' => '3400930000001', // Exemple de code à scanner
                'unite' => 'pièce',
                'quantite' => 100,
                'created_at' => now(),
            ],
            [
                'nom' => 'Sirop Hélicidine',
                'code_barre' => '3400935678902',
                'unite' => 'ml',
                'quantite' => 250,
                'created_at' => now(),
            ],
            [
                'nom' => 'Spasfon',
                'code_barre' => 'SPASFON-001', // Tu peux aussi utiliser des textes simples
                'unite' => 'pièce',
                'quantite' => 30,
                'created_at' => now(),
            ],
            [
                'nom' => 'Gaviscon Liquide',
                'code_barre' => 'GAVIS-ML-99',
                'unite' => 'ml',
                'quantite' => 500,
                'created_at' => now(),
            ],
        ]);
    }
}