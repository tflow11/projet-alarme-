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
        Schema::create('preuves', function (Blueprint $table) {
            $table->id();

            $table->foreignId('prise_id')
                ->constrained('prises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->string('image'); // chemin de l'image
            $table->dateTime('date_validation');

            $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('preuves');
    }
};
