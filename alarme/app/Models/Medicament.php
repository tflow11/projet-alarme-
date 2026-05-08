<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Medicament extends Model
{
    use HasFactory;


 
     protected $fillable = ['nom', 'quantite','unite', 'code_barre'];
    

    public function traitements()
    {
        return $this->hasMany(Traitement::class);
    }

    public function stock()
    {
        return $this->hasOne(Stock::class);
    }
}