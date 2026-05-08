<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medecins', function (Blueprint $blueprint) {
            // Ajoute la colonne téléphone (nullable au cas où certains n'en ont pas)
            $blueprint->string('telephone')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('medecins', function (Blueprint $blueprint) {
            $blueprint->dropColumn('telephone');
        });
    }
};