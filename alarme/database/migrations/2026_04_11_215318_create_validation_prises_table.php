<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration pour créer la table.
     */
    public function up(): void
    {
        Schema::create('validation_prises', function (Blueprint $table) {
            $table->id();
            
            // On lie la validation au traitement (doit être le même type que l'id de la table traitements)
            $table->unsignedBigInteger('id_traitement');
            
            // Définition de la clé étrangère : si le traitement est supprimé, la validation l'est aussi
            $table->foreign('id_traitement')
                  ->references('id')
                  ->on('traitements')
                  ->onDelete('cascade');

            $table->string('prise_numero'); // Stockera "Prise 1", "Prise 2", etc.
            $table->dateTime('date_validation'); // Date et heure exacte du clic du patient
            
            $table->timestamps(); // created_at et updated_at
        });
    }

    /**
     * Annule la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('validation_prises');
    }
};