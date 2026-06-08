<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MedecinController;
use App\Http\Controllers\TraitementController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ContactController; 

// --- AUTHENTIFICATION ---
Route::post('/medecins/register', [MedecinController::class, 'register']);
Route::post('/medecins/login', [MedecinController::class, 'login']);
Route::post('/patient/login', [PatientController::class, 'login']);

// --- ACTIONS MÉDECIN ---
Route::get('/dependencies', [TraitementController::class, 'dependencies']);
Route::get('/traitements', [TraitementController::class, 'index']);
Route::post('/traitements', [TraitementController::class, 'store']); 
Route::delete('/traitements/{id}', [TraitementController::class, 'destroy']); 

// Dashboard Médecin : Voir tous les RDV de ses patients
Route::get('/contact/rdv', [ContactController::class, 'index']); 
Route::put('/contact/rdv/{id}/valider', [ContactController::class, 'valider']);
Route::delete('/contact/rdv/{id}', [ContactController::class, 'destroy']);

Route::post('/patients', [MedecinController::class, 'storePatient']);
Route::get('/traitements-suivi', [MedecinController::class, 'getTraitementsAvecValidations']);

// --- ACTIONS PATIENT & PUBLIC ---
Route::get('/traitements/patient/{id}', [PatientController::class, 'getTraitementsPatient']);
Route::post('/traitements/valider', [PatientController::class, 'validerPrise']);

// Route pour que le patient envoie une demande
Route::post('/contact/rdv', [ContactController::class, 'store']);

// NOUVEAU : Route publique pour afficher la liste des RDV confirmés (utilisée dans Contact.js)
Route::get('/contact/rdv/confirmes', [ContactController::class, 'rdvConfirmes']);

// Liste des médecins pour le menu déroulant
Route::get('/medecins', [MedecinController::class, 'index']);