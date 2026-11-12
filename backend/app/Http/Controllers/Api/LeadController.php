<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class LeadController extends Controller
{
    /**
     * Display a paginated listing of leads with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Lead::with(['assignedEmployee', 'creator']);

        // Role-based visibility enforcement
        if ($user->role === 'employee') {
            $query->where('assigned_to', $user->id);
        }

        // Search by customer_name, phone, or email
        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->query('status');
            if (in_array($status, Lead::ALLOWED_STATUSES, true)) {
                $query->where('status', $status);
            }
        }

        // Admin-only filter by assigned employee ID
        if ($user->role === 'admin' && $request->filled('assigned_to')) {
            $assignedTo = $request->query('assigned_to');
            if ($assignedTo === 'unassigned') {
                $query->whereNull('assigned_to');
            } elseif (is_numeric($assignedTo)) {
                $query->where('assigned_to', (int) $assignedTo);
            }
        }

        // Default sorting: Latest leads first
        $query->latest('id');

        // Pagination
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Leads retrieved successfully.',
            'data' => LeadResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created lead in storage.
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $data = [
            'customer_name' => $validated['customer_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'company_name' => $validated['company_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? Lead::STATUS_NEW,
            'created_by' => $user->id,
        ];

        if ($user->role === 'admin') {
            $data['assigned_to'] = $validated['assigned_to'] ?? null;
        } else {
            // Employee automatically assigns lead to themselves
            $data['assigned_to'] = $user->id;
        }

        $lead = Lead::create($data);
        $lead->load(['assignedEmployee', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Lead created successfully.',
            'data' => new LeadResource($lead),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified lead.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $lead = Lead::with(['assignedEmployee', 'creator'])->find($id);

        if (! $lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Employee can only view leads assigned to them
        if ($user->role === 'employee' && (int) $lead->assigned_to !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You cannot access this lead.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead details retrieved successfully.',
            'data' => new LeadResource($lead),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified lead in storage.
     */
    public function update(UpdateLeadRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $lead = Lead::find($id);

        if (! $lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Employee can only update their assigned leads
        if ($user->role === 'employee' && (int) $lead->assigned_to !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You cannot update this lead.',
            ], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validated();
        $updateData = [];

        // Safe fields allowed to be updated
        $allowedFields = ['customer_name', 'phone', 'email', 'company_name', 'description', 'status'];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        // Only Admin can modify assigned_to
        if ($user->role === 'admin' && array_key_exists('assigned_to', $validated)) {
            $updateData['assigned_to'] = $validated['assigned_to'];
        }

        // Never allow created_by to be changed
        $lead->update($updateData);
        $lead->load(['assignedEmployee', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Lead updated successfully.',
            'data' => new LeadResource($lead),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified lead from storage (Admin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Enforce Admin only
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only administrators can delete leads.',
            ], Response::HTTP_FORBIDDEN);
        }

        $lead = Lead::find($id);

        if (! $lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        DB::transaction(function () use ($lead) {
            $lead->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Lead deleted successfully.',
        ], Response::HTTP_OK);
    }
}

