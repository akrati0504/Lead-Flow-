<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFollowUpRequest;
use App\Http\Requests\UpdateFollowUpRequest;
use App\Http\Resources\FollowUpResource;
use App\Models\FollowUp;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FollowUpController extends Controller
{
    /**
     * Display a listing of follow-ups with search, filters, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = FollowUp::with(['lead', 'creator']);

        // Scope to assigned leads if employee
        if ($user->role === 'employee') {
            $query->whereHas('lead', function ($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        }

        // Filter by specific lead ID
        if ($request->filled('lead_id')) {
            $leadId = (int) $request->query('lead_id');
            $query->where('lead_id', $leadId);
        }

        // Admin-only filter by creator/employee ID
        if ($user->role === 'admin' && $request->filled('created_by')) {
            $query->where('created_by', (int) $request->query('created_by'));
        }

        // Search by lead customer name or phone
        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $query->whereHas('lead', function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Latest follow-up date first by default
        $query->orderBy('follow_up_date', 'desc')->latest('id');

        // Pagination
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Follow-ups retrieved successfully.',
            'data' => FollowUpResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created follow-up.
     */
    public function store(StoreFollowUpRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $followUp = FollowUp::create([
            'lead_id' => $validated['lead_id'],
            'follow_up_date' => $validated['follow_up_date'],
            'remarks' => $validated['remarks'],
            'next_follow_up_date' => $validated['next_follow_up_date'] ?? null,
            'created_by' => $user->id,
        ]);

        $followUp->load(['lead', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Follow-up created successfully.',
            'data' => new FollowUpResource($followUp),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified follow-up.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $followUp = FollowUp::with(['lead', 'creator'])->find($id);

        if (! $followUp) {
            return response()->json([
                'success' => false,
                'message' => 'Follow-up not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Employee can only view follow-ups for leads currently assigned to them
        if ($user->role === 'employee' && (! $followUp->lead || (int) $followUp->lead->assigned_to !== (int) $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You cannot access this follow-up.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'success' => true,
            'message' => 'Follow-up details retrieved successfully.',
            'data' => new FollowUpResource($followUp),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified follow-up.
     */
    public function update(UpdateFollowUpRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $followUp = FollowUp::with('lead')->find($id);

        if (! $followUp) {
            return response()->json([
                'success' => false,
                'message' => 'Follow-up not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Permission check for Employee:
        // Must have personally created this follow-up AND the lead must still be assigned to them.
        if ($user->role === 'employee') {
            if ((int) $followUp->created_by !== (int) $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. You can only edit follow-ups you personally created.',
                ], Response::HTTP_FORBIDDEN);
            }

            if (! $followUp->lead || (int) $followUp->lead->assigned_to !== (int) $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. The lead is no longer assigned to you.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        $validated = $request->validated();
        $updateData = [];

        // Safe attributes to update (lead_id and created_by are strictly immutable)
        if (array_key_exists('follow_up_date', $validated)) {
            $updateData['follow_up_date'] = $validated['follow_up_date'];
        }
        if (array_key_exists('remarks', $validated)) {
            $updateData['remarks'] = $validated['remarks'];
        }
        if (array_key_exists('next_follow_up_date', $validated)) {
            $updateData['next_follow_up_date'] = $validated['next_follow_up_date'];
        }

        $followUp->update($updateData);
        $followUp->load(['lead', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Follow-up updated successfully.',
            'data' => new FollowUpResource($followUp),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified follow-up from storage (Admin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Admin-only restriction
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only administrators can delete follow-up records.',
            ], Response::HTTP_FORBIDDEN);
        }

        $followUp = FollowUp::find($id);

        if (! $followUp) {
            return response()->json([
                'success' => false,
                'message' => 'Follow-up not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        $followUp->delete();

        return response()->json([
            'success' => true,
            'message' => 'Follow-up deleted successfully.',
        ], Response::HTTP_OK);
    }

    /**
     * Display follow-up history for a specific lead.
     */
    public function leadFollowUps(Request $request, int $leadId): JsonResponse
    {
        $user = $request->user();
        $lead = Lead::find($leadId);

        if (! $lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Employee can only view history for assigned leads
        if ($user->role === 'employee' && (int) $lead->assigned_to !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You cannot access follow-up history for this lead.',
            ], Response::HTTP_FORBIDDEN);
        }

        $followUps = FollowUp::with('creator')
            ->where('lead_id', $leadId)
            ->orderBy('follow_up_date', 'desc')
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lead follow-up history retrieved successfully.',
            'lead' => [
                'id' => $lead->id,
                'customer_name' => $lead->customer_name,
                'phone' => $lead->phone,
                'company_name' => $lead->company_name,
                'status' => $lead->status,
                'assigned_to' => $lead->assigned_to,
            ],
            'data' => FollowUpResource::collection($followUps),
        ], Response::HTTP_OK);
    }
}

