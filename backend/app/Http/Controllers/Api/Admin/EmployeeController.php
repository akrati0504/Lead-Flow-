<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeRequest;
use App\Http\Requests\Admin\UpdateEmployeeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmployeeController extends Controller
{
    /**
     * Display a paginated listing of employees with search and status filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'employee');

        // Search by name or email
        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by is_active status
        if ($request->filled('is_active')) {
            $isActive = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        // Latest employee accounts first
        $query->latest('id');

        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Employees retrieved successfully.',
            'data' => UserResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created employee account in storage.
     */
    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $employee = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'], // User model automatically casts password to 'hashed'
            'role' => 'employee', // strictly employee role
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully.',
            'data' => new UserResource($employee),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified employee.
     */
    public function show(int $id): JsonResponse
    {
        $employee = User::where('role', 'employee')->find($id);

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'message' => 'Employee details retrieved successfully.',
            'data' => new UserResource($employee),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified employee account in storage.
     */
    public function update(UpdateEmployeeRequest $request, int $id): JsonResponse
    {
        $employee = User::where('role', 'employee')->find($id);

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validated();
        $updateData = [];

        if (array_key_exists('name', $validated)) {
            $updateData['name'] = $validated['name'];
        }
        if (array_key_exists('email', $validated)) {
            $updateData['email'] = $validated['email'];
        }
        if (! empty($validated['password'])) {
            $updateData['password'] = $validated['password'];
        }
        if (array_key_exists('is_active', $validated)) {
            $updateData['is_active'] = (bool) $validated['is_active'];
        }

        $employee->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully.',
            'data' => new UserResource($employee),
        ], Response::HTTP_OK);
    }
}

