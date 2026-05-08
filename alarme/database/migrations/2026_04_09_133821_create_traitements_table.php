<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
  Schema::create('traitements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('id_patient')->constrained('patients');
    $table->foreignId('id_medicament')->constrained('medicaments');
    $table->foreignId('id_medecin')->constrained('medecins');
    $table->date('date_debut');
    $table->integer('duree');

    // La prise 1 reste souvent obligatoire (au moins une prise)
    $table->time('heure1');
    $table->integer('qte1');

    // Les prises 2 et 3 deviennent optionnelles
    $table->time('heure2')->nullable();
    $table->integer('qte2')->nullable();
    $table->time('heure3')->nullable();
    $table->integer('qte3')->nullable();

    $table->timestamps();

});
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traitements');
    }
};
