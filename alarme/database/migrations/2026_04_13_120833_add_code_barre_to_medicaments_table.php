<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            // On ajoute le champ code_barre (string) après le nom du médicament
            // On le met en nullable au cas où certains médicaments n'en ont pas encore
            $table->string('code_barre')->nullable()->after('nom');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            // Si on annule la migration, on supprime la colonne
            $table->dropColumn('code_barre');
        });
    }
};