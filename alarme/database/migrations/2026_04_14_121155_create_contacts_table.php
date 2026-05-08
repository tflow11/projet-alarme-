<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
   public function up()
{
    Schema::create('contacts', function (Blueprint $table) {
        $table->id();
        $table->string('nom_client');
        $table->string('telephone');
        $table->dateTime('date_rdv');
        $table->string('nom_medecin'); // <--- DOIT ÊTRE PRÉSENT
        $table->string('sujet');
        $table->text('message')->nullable();
        $table->string('statut')->default('En attente');
        $table->timestamps();
    });
}

    public function down() {
        Schema::dropIfExists('contacts');
    }
};