<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medecin extends Model
{
    // Indispensable pour que Laravel accepte les données de React
protected $fillable = ['nom', 'email', 'password', 'telephone'];}