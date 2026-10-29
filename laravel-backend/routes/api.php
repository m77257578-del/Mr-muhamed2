<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlatformApiController;

/*
|--------------------------------------------------------------------------
| API Routes - المنصة التعليمية (Laravel Bridge)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/public-data', [PlatformApiController::class, 'getPublicData']);
Route::post('/student/login', [PlatformApiController::class, 'authenticateStudent']);
Route::post('/coupon/verify', [PlatformApiController::class, 'verifyCoupon']);
