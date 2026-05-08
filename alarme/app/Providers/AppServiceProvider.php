<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Charger les routes API
        Route::prefix('api')
            ->middleware('api')
            ->group(base_path('routes/api.php'));

        // Charger les routes WEB
        Route::middleware('web')
            ->group(base_path('routes/web.php'));
    }
}