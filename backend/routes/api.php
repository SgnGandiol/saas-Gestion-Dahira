<?php

use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/member-photo', [UploadController::class, 'memberPhoto']);
});
