<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function memberPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,webp|max:4096',
        ]);

        $ext      = $request->file('file')->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid() . '.' . $ext;
        $request->file('file')->storeAs('uploads/members', $filename, 'public');

        return response()->json(['url' => '/storage/uploads/members/' . $filename]);
    }
}
