<?php

namespace App\Http\Controllers;

use App\Models\Medicament;
use Illuminate\Http\Request;

class MedicamentController extends Controller
{
    public function index()
    {
        return response()->json(Medicament::all());
    }

    public function store(Request $request)
    {
        $medicament = Medicament::create($request->all());
        return response()->json($medicament);
    }
}