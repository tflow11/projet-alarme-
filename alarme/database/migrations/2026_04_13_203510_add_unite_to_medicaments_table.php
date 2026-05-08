<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            // On ajoute la colonne 'unite' avec 'pièce' par défaut
            // On la place après la colonne 'nom' pour garder une table propre
            $table->string('unite')->default('pièce')->after('nom');
        });
    }

    public function down(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            $table->dropColumn('unite');
        });
    }
};