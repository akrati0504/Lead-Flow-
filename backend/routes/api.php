<?php

use App\Http\Controllers\Api\Admin\EmployeeController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FollowUpController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'LeadFlow Backend API is running successfully',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Requires auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Admin Role-Protected Routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/test', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Access granted: Welcome to the Admin secure area.',
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'role' => $request->user()->role,
                ],
            ]);
        });

        // Employee Management APIs (Admin Only)
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/{id}', [EmployeeController::class, 'show']);
        Route::match(['put', 'patch'], '/employees/{id}', [EmployeeController::class, 'update']);
    });

    // Employee Role-Protected Test Endpoint
    Route::get('/employee/test', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Access granted: Welcome to the Employee secure area.',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'role' => $request->user()->role,
            ],
        ]);
    })->middleware('role:employee');

    // Dashboard Analytics Routes
    Route::prefix('dashboard')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/follow-ups', [DashboardController::class, 'followUps']);
        Route::get('/recent-leads', [DashboardController::class, 'recentLeads']);
    });

    // Lead Management CRUD Routes
    Route::prefix('leads')->group(function () {
        Route::get('/', [LeadController::class, 'index']);
        Route::post('/', [LeadController::class, 'store']);
        Route::get('/{id}', [LeadController::class, 'show']);
        Route::match(['put', 'patch'], '/{id}', [LeadController::class, 'update']);
        Route::delete('/{id}', [LeadController::class, 'destroy']);

        // Follow-up history for a specific lead
        Route::get('/{leadId}/follow-ups', [FollowUpController::class, 'leadFollowUps']);
    });

    // Follow-up Management REST Routes
    Route::prefix('follow-ups')->group(function () {
        Route::get('/', [FollowUpController::class, 'index']);
        Route::post('/', [FollowUpController::class, 'store']);
        Route::get('/{id}', [FollowUpController::class, 'show']);
        Route::match(['put', 'patch'], '/{id}', [FollowUpController::class, 'update']);
        Route::delete('/{id}', [FollowUpController::class, 'destroy']);
    });
});
