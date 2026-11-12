<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FollowUpResource;
use App\Http\Resources\LeadResource;
use App\Models\FollowUp;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class DashboardController extends Controller
{
    /**
     * Get summarized metrics for leads and follow-ups.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Leads query scoped by role
        $leadQuery = Lead::query();
        if ($user->role === 'employee') {
            $leadQuery->where('assigned_to', $user->id);
        }

        // Aggregate lead counts in a single query
        $leadStats = (clone $leadQuery)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "new" THEN 1 ELSE 0 END) as count_new,
                SUM(CASE WHEN status = "contacted" THEN 1 ELSE 0 END) as count_contacted,
                SUM(CASE WHEN status = "interested" THEN 1 ELSE 0 END) as count_interested,
                SUM(CASE WHEN status = "converted" THEN 1 ELSE 0 END) as count_converted,
                SUM(CASE WHEN status = "lost" THEN 1 ELSE 0 END) as count_lost
            ')
            ->first();

        // 2. Follow-ups query scoped by role (via lead assignment)
        $followUpQuery = FollowUp::query()
            ->whereNotNull('next_follow_up_date');

        if ($user->role === 'employee') {
            $followUpQuery->whereHas('lead', function ($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        }

        $now = Carbon::now();
        $startOfToday = $now->copy()->startOfDay();
        $endOfToday = $now->copy()->endOfDay();
        $endOfNext7Days = $now->copy()->addDays(7)->endOfDay();

        // Aggregate follow-up counts in a single query
        $followUpStats = (clone $followUpQuery)
            ->selectRaw('
                SUM(CASE WHEN next_follow_up_date >= ? AND next_follow_up_date <= ? THEN 1 ELSE 0 END) as count_today,
                SUM(CASE WHEN next_follow_up_date < ? THEN 1 ELSE 0 END) as count_overdue,
                SUM(CASE WHEN next_follow_up_date > ? AND next_follow_up_date <= ? THEN 1 ELSE 0 END) as count_upcoming
            ', [
                $startOfToday, $endOfToday,
                $startOfToday,
                $endOfToday, $endOfNext7Days
            ])
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard summary retrieved successfully.',
            'data' => [
                'leads' => [
                    'total' => (int) ($leadStats->total ?? 0),
                    'new' => (int) ($leadStats->count_new ?? 0),
                    'contacted' => (int) ($leadStats->count_contacted ?? 0),
                    'interested' => (int) ($leadStats->count_interested ?? 0),
                    'converted' => (int) ($leadStats->count_converted ?? 0),
                    'lost' => (int) ($leadStats->count_lost ?? 0),
                ],
                'follow_ups' => [
                    'today' => (int) ($followUpStats->count_today ?? 0),
                    'overdue' => (int) ($followUpStats->count_overdue ?? 0),
                    'upcoming' => (int) ($followUpStats->count_upcoming ?? 0),
                ],
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Get scheduled follow-ups filtered by period (today, upcoming, overdue).
     */
    public function followUps(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'period' => ['required', 'string', 'in:today,upcoming,overdue'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $period = $validated['period'];

        $query = FollowUp::with(['lead', 'creator'])
            ->whereNotNull('next_follow_up_date');

        // Scope to assigned leads if employee
        if ($user->role === 'employee') {
            $query->whereHas('lead', function ($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        }

        $now = Carbon::now();
        $startOfToday = $now->copy()->startOfDay();
        $endOfToday = $now->copy()->endOfDay();
        $endOfNext7Days = $now->copy()->addDays(7)->endOfDay();

        if ($period === 'today') {
            $query->whereBetween('next_follow_up_date', [$startOfToday, $endOfToday])
                  ->orderBy('next_follow_up_date', 'asc');
        } elseif ($period === 'upcoming') {
            $query->where('next_follow_up_date', '>', $endOfToday)
                  ->where('next_follow_up_date', '<=', $endOfNext7Days)
                  ->orderBy('next_follow_up_date', 'asc');
        } elseif ($period === 'overdue') {
            $query->where('next_follow_up_date', '<', $startOfToday)
                  ->orderBy('next_follow_up_date', 'asc');
        }

        $perPage = (int) ($validated['per_page'] ?? 10);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard follow-ups retrieved successfully.',
            'period' => $period,
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
     * Get recent leads (latest 5 by default).
     */
    public function recentLeads(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Lead::with(['assignedEmployee', 'creator']);

        // Scope to assigned leads if employee
        if ($user->role === 'employee') {
            $query->where('assigned_to', $user->id);
        }

        // Latest leads first
        $query->latest('id');

        $limit = (int) $request->query('limit', 5);
        if ($limit < 1 || $limit > 50) {
            $limit = 5;
        }

        $leads = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'message' => 'Recent leads retrieved successfully.',
            'data' => LeadResource::collection($leads),
        ], Response::HTTP_OK);
    }
}

