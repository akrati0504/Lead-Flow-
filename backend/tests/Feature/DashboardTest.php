<?php

namespace Tests\Feature;

use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $employee1;
    private User $employee2;

    protected function setUp(): void
    {
        parent::setUp();

        // Fix predictable test time
        Carbon::setTestNow(Carbon::parse('2026-11-12 12:00:00'));

        $this->admin = User::create([
            'name' => 'LeadFlow Admin',
            'email' => 'admin@leadflow.test',
            'password' => 'password123',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->employee1 = User::create([
            'name' => 'Rahul Sharma',
            'email' => 'rahul.sharma@leadflow.test',
            'password' => 'password123',
            'role' => 'employee',
            'is_active' => true,
        ]);

        $this->employee2 = User::create([
            'name' => 'Priya Patel',
            'email' => 'priya.patel@leadflow.test',
            'password' => 'password123',
            'role' => 'employee',
            'is_active' => true,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** 1. Unauthenticated users cannot access dashboard endpoints */
    public function test_unauthenticated_users_cannot_access_dashboard_endpoints(): void
    {
        $this->getJson('/api/dashboard/summary')->assertStatus(401);
        $this->getJson('/api/dashboard/follow-ups?period=today')->assertStatus(401);
        $this->getJson('/api/dashboard/recent-leads')->assertStatus(401);
    }

    /** 2. Admin can retrieve system-wide dashboard statistics */
    public function test_admin_can_retrieve_system_wide_dashboard_statistics(): void
    {
        // Lead assigned to emp1
        Lead::create([
            'customer_name' => 'Lead One',
            'phone' => '+91 90000 00001',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Lead assigned to emp2
        Lead::create([
            'customer_name' => 'Lead Two',
            'phone' => '+91 90000 00002',
            'status' => 'contacted',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        // Unassigned lead
        Lead::create([
            'customer_name' => 'Lead Three',
            'phone' => '+91 90000 00003',
            'status' => 'interested',
            'assigned_to' => null,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.leads.total', 3)
            ->assertJsonPath('data.leads.new', 1)
            ->assertJsonPath('data.leads.contacted', 1)
            ->assertJsonPath('data.leads.interested', 1)
            ->assertJsonPath('data.leads.converted', 0)
            ->assertJsonPath('data.leads.lost', 0);
    }

    /** 3. Employee sees only their assigned leads in dashboard statistics */
    public function test_employee_sees_only_assigned_leads_in_dashboard_statistics(): void
    {
        // Assigned to emp1
        Lead::create([
            'customer_name' => 'Emp1 Lead A',
            'phone' => '+91 90000 00011',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);
        Lead::create([
            'customer_name' => 'Emp1 Lead B',
            'phone' => '+91 90000 00012',
            'status' => 'converted',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Assigned to emp2
        Lead::create([
            'customer_name' => 'Emp2 Lead C',
            'phone' => '+91 90000 00013',
            'status' => 'new',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.leads.total', 2)
            ->assertJsonPath('data.leads.new', 1)
            ->assertJsonPath('data.leads.converted', 1)
            ->assertJsonPath('data.leads.contacted', 0);
    }

    /** 4. Lead status counts are correct across all 5 statuses */
    public function test_lead_status_counts_are_correct(): void
    {
        foreach (['new', 'contacted', 'interested', 'converted', 'lost'] as $st) {
            Lead::create([
                'customer_name' => "Lead {$st}",
                'phone' => '+91 90000 00099',
                'status' => $st,
                'assigned_to' => $this->admin->id,
                'created_by' => $this->admin->id,
            ]);
        }

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.leads.total', 5)
            ->assertJsonPath('data.leads.new', 1)
            ->assertJsonPath('data.leads.contacted', 1)
            ->assertJsonPath('data.leads.interested', 1)
            ->assertJsonPath('data.leads.converted', 1)
            ->assertJsonPath('data.leads.lost', 1);
    }

    /** 5. Follow-ups due today are counted correctly */
    public function test_follow_ups_due_today_are_counted_correctly(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Today FollowUp Lead',
            'phone' => '+91 91111 00001',
            'status' => 'contacted',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Scheduled for today (earlier today and later today)
        FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => Carbon::now()->subHours(2),
            'remarks' => 'Morning call',
            'next_follow_up_date' => Carbon::parse('2026-11-12 15:00:00'),
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => Carbon::now()->subHours(1),
            'remarks' => 'Evening follow up',
            'next_follow_up_date' => Carbon::parse('2026-11-12 20:30:00'),
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.follow_ups.today', 2);
    }

    /** 6. Overdue follow-ups are counted correctly */
    public function test_overdue_follow_ups_are_counted_correctly(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Overdue Lead',
            'phone' => '+91 91111 00002',
            'status' => 'contacted',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Next follow up was yesterday
        FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => Carbon::now()->subDays(5),
            'remarks' => 'Old meeting',
            'next_follow_up_date' => Carbon::parse('2026-11-11 18:00:00'),
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.follow_ups.overdue', 1);
    }

    /** 7. Upcoming follow-ups within 7 days are counted correctly */
    public function test_upcoming_follow_ups_within_7_days_are_counted_correctly(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Upcoming Lead',
            'phone' => '+91 91111 00003',
            'status' => 'interested',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Scheduled 3 days from now (within 7 days)
        FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'Next week call',
            'next_follow_up_date' => Carbon::parse('2026-11-15 10:00:00'),
            'created_by' => $this->employee1->id,
        ]);

        // Scheduled 10 days from now (beyond 7 days)
        FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'Far future call',
            'next_follow_up_date' => Carbon::parse('2026-11-22 10:00:00'),
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.follow_ups.upcoming', 1);
    }

    /** 8. Null next follow-up dates are excluded from follow-up statistics */
    public function test_null_next_follow_up_dates_are_excluded(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Completed Lead',
            'phone' => '+91 91111 00004',
            'status' => 'converted',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'No next date scheduled',
            'next_follow_up_date' => null,
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/dashboard/summary');
        $response->assertStatus(200)
            ->assertJsonPath('data.follow_ups.today', 0)
            ->assertJsonPath('data.follow_ups.overdue', 0)
            ->assertJsonPath('data.follow_ups.upcoming', 0);
    }

    /** 9. Admin can retrieve all relevant dashboard follow-ups */
    public function test_admin_can_retrieve_all_dashboard_follow_ups(): void
    {
        $leadA = Lead::create([
            'customer_name' => 'Lead A',
            'phone' => '+91 92222 00001',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);
        $leadB = Lead::create([
            'customer_name' => 'Lead B',
            'phone' => '+91 92222 00002',
            'status' => 'new',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        FollowUp::create([
            'lead_id' => $leadA->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'Lead A follow up today',
            'next_follow_up_date' => Carbon::parse('2026-11-12 14:00:00'),
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $leadB->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'Lead B follow up today',
            'next_follow_up_date' => Carbon::parse('2026-11-12 16:00:00'),
            'created_by' => $this->employee2->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/follow-ups?period=today');

        $response->assertStatus(200)
            ->assertJsonPath('pagination.total', 2);
    }

    /** 10. Employee cannot retrieve follow-ups belonging to another employee's leads */
    public function test_employee_cannot_retrieve_other_employees_follow_ups(): void
    {
        $leadEmp1 = Lead::create([
            'customer_name' => 'Lead Emp1',
            'phone' => '+91 93333 00001',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);
        $leadEmp2 = Lead::create([
            'customer_name' => 'Lead Emp2',
            'phone' => '+91 93333 00002',
            'status' => 'new',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        FollowUp::create([
            'lead_id' => $leadEmp1->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'Emp 1 today note',
            'next_follow_up_date' => Carbon::parse('2026-11-12 14:00:00'),
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $leadEmp2->id,
            'follow_up_date' => Carbon::now(),
            'remarks' => 'Emp 2 today note',
            'next_follow_up_date' => Carbon::parse('2026-11-12 16:00:00'),
            'created_by' => $this->employee2->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')
            ->getJson('/api/dashboard/follow-ups?period=today');

        $response->assertStatus(200)
            ->assertJsonPath('pagination.total', 1);

        $this->assertEquals($leadEmp1->id, $response->json('data.0.lead_id'));
    }

    /** 11. Admin can retrieve all recent leads */
    public function test_admin_can_retrieve_all_recent_leads(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            Lead::create([
                'customer_name' => "Recent Lead {$i}",
                'phone' => "+91 94444 0000{$i}",
                'status' => 'new',
                'assigned_to' => ($i % 2 === 0) ? $this->employee2->id : $this->employee1->id,
                'created_by' => $this->admin->id,
            ]);
        }

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/recent-leads');

        $response->assertStatus(200);
        // Default limit is 5
        $this->assertCount(5, $response->json('data'));
        // Verify latest first
        $this->assertEquals('Recent Lead 6', $response->json('data.0.customer_name'));
    }

    /** 12. Employee sees only their assigned recent leads */
    public function test_employee_sees_only_assigned_recent_leads(): void
    {
        Lead::create([
            'customer_name' => 'Emp1 Recent Lead',
            'phone' => '+91 95555 00001',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        Lead::create([
            'customer_name' => 'Emp2 Recent Lead',
            'phone' => '+91 95555 00002',
            'status' => 'new',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')
            ->getJson('/api/dashboard/recent-leads');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Emp1 Recent Lead', $response->json('data.0.customer_name'));
    }

    /** 13. Invalid period values return HTTP 422 */
    public function test_invalid_period_returns_422(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/follow-ups?period=invalid_period');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }

    /** 14. Empty database results return valid zero counts and empty lists */
    public function test_empty_database_returns_zero_counts_and_empty_lists(): void
    {
        $responseSummary = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/summary');
        $responseSummary->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'leads' => [
                        'total' => 0,
                        'new' => 0,
                        'contacted' => 0,
                        'interested' => 0,
                        'converted' => 0,
                        'lost' => 0,
                    ],
                    'follow_ups' => [
                        'today' => 0,
                        'overdue' => 0,
                        'upcoming' => 0,
                    ],
                ],
            ]);

        $responseFollowUps = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/follow-ups?period=today');
        $responseFollowUps->assertStatus(200)
            ->assertJsonPath('pagination.total', 0)
            ->assertJsonCount(0, 'data');

        $responseRecent = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/recent-leads');
        $responseRecent->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}

