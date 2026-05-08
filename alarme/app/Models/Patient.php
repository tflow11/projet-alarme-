<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Patient extends Model
{

    use HasFactory;

    protected $fillable = ['nom', 'prenom', 'email', 'password'];

    public function traitements()
    {
        return $this->hasMany(Traitement::class);
    }

}
