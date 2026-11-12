<?php

namespace Tests\Feature;

use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowUpCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $employee1;
    private User $employee2;
    private Lead $lead1; // assigned to employee1
    private Lead $lead2; // assigned to employee2
    private Lead $unassignedLead;

    protected function setUp(): void
    {
        parent::setUp();

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

        $this->lead1 = Lead::create([
            'customer_name' => 'Acme Corporation',
            'phone' => '+91 98765 00001',
            'email' => 'contact@acme.com',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        $this->lead2 = Lead::create([
            'customer_name' => 'Global Logistics Inc',
            'phone' => '+91 98765 00002',
            'email' => 'info@globallogistics.com',
            'status' => 'contacted',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        $this->unassignedLead = Lead::create([
            'customer_name' => 'Unassigned Client',
            'phone' => '+91 98765 00003',
            'status' => 'new',
            'assigned_to' => null,
            'created_by' => $this->admin->id,
        ]);
    }

    /** 1. Unauthenticated user cannot access follow-up APIs */
    public function test_unauthenticated_user_cannot_access_follow_up_apis(): void
    {
        $this->getJson('/api/follow-ups')->assertStatus(401);
        $this->postJson('/api/follow-ups', [])->assertStatus(401);
        $this->getJson('/api/follow-ups/1')->assertStatus(401);
        $this->putJson('/api/follow-ups/1', [])->assertStatus(401);
        $this->deleteJson('/api/follow-ups/1')->assertStatus(401);
        $this->getJson('/api/leads/1/follow-ups')->assertStatus(401);
    }

    /** 2. Admin can view all follow-ups */
    public function test_admin_can_view_all_follow_ups(): void
    {
        FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now()->subDay(),
            'remarks' => 'Admin follow up for lead 1',
            'created_by' => $this->admin->id,
        ]);

        FollowUp::create([
            'lead_id' => $this->lead2->id,
            'follow_up_date' => now(),
            'remarks' => 'Employee 2 follow up for lead 2',
            'created_by' => $this->employee2->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/follow-ups');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);

        $this->assertEquals(2, $response->json('pagination.total'));
    }

    /** 3. Employee can view only follow-ups for assigned leads */
    public function test_employee_can_view_only_follow_ups_for_assigned_leads(): void
    {
        FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Follow up on lead 1',
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $this->lead2->id,
            'follow_up_date' => now(),
            'remarks' => 'Follow up on lead 2',
            'created_by' => $this->employee2->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/follow-ups');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->lead1->id, $data[0]['lead_id']);
    }

    /** 4. Admin can create a follow-up for any lead */
    public function test_admin_can_create_a_follow_up(): void
    {
        $payload = [
            'lead_id' => $this->lead2->id,
            'follow_up_date' => '2026-11-04 14:00:00',
            'remarks' => 'Admin reviewing pricing schedule.',
            'next_follow_up_date' => '2026-11-10 10:00:00',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/follow-ups', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.lead_id', $this->lead2->id)
            ->assertJsonPath('data.created_by', $this->admin->id)
            ->assertJsonPath('data.remarks', 'Admin reviewing pricing schedule.');
    }

    /** 5. Employee can create a follow-up for an assigned lead */
    public function test_employee_can_create_a_follow_up_for_assigned_lead(): void
    {
        $payload = [
            'lead_id' => $this->lead1->id,
            'follow_up_date' => '2026-11-04 15:30:00',
            'remarks' => 'Called client to discuss feature requirements.',
            'next_follow_up_date' => '2026-11-07 11:00:00',
        ];

        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/follow-ups', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.lead_id', $this->lead1->id)
            ->assertJsonPath('data.created_by', $this->employee1->id);
    }

    /** 6. Employee cannot create a follow-up for another employee's lead */
    public function test_employee_cannot_create_follow_up_for_another_employees_lead(): void
    {
        $payload = [
            'lead_id' => $this->lead2->id, // assigned to employee2
            'follow_up_date' => '2026-11-04 16:00:00',
            'remarks' => 'Intruder remark',
        ];

        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/follow-ups', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lead_id']);
    }

    /** 7. Employee cannot create a follow-up for an unassigned lead */
    public function test_employee_cannot_create_follow_up_for_unassigned_lead(): void
    {
        $payload = [
            'lead_id' => $this->unassignedLead->id,
            'follow_up_date' => '2026-11-04 16:00:00',
            'remarks' => 'Trying to follow up on unassigned lead',
        ];

        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/follow-ups', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lead_id']);
    }

    /** 8. created_by is automatically set to the authenticated user */
    public function test_created_by_is_automatically_set_to_authenticated_user(): void
    {
        $payload = [
            'lead_id' => $this->lead1->id,
            'follow_up_date' => '2026-11-04 17:00:00',
            'remarks' => 'Testing created_by spoofing prevention.',
            'created_by' => 999, // Attempted spoof
        ];

        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/follow-ups', $payload);
        $response->assertStatus(201);
        $this->assertEquals($this->employee1->id, $response->json('data.created_by'));
    }

    /** 9. Employee cannot change lead_id or created_by */
    public function test_employee_cannot_change_lead_id_or_created_by(): void
    {
        $followUp = FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Original follow up note.',
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->putJson("/api/follow-ups/{$followUp->id}", [
            'lead_id' => $this->lead2->id,
            'created_by' => $this->admin->id,
            'remarks' => 'Updated remarks only.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.remarks', 'Updated remarks only.')
            ->assertJsonPath('data.lead_id', $this->lead1->id)
            ->assertJsonPath('data.created_by', $this->employee1->id);
    }

    /** 10. Employee can edit their own follow-up for an assigned lead */
    public function test_employee_can_edit_own_follow_up_for_assigned_lead(): void
    {
        $followUp = FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Initial discussion.',
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->putJson("/api/follow-ups/{$followUp->id}", [
            'remarks' => 'Updated client discussion details.',
            'next_follow_up_date' => '2026-11-15 10:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.remarks', 'Updated client discussion details.');
    }

    /** 11. Employee cannot edit another user's follow-up */
    public function test_employee_cannot_edit_another_users_follow_up(): void
    {
        // Admin creates a follow-up on lead 1
        $followUp = FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Admin note on lead 1',
            'created_by' => $this->admin->id,
        ]);

        // Employee 1 attempts to edit Admin's follow up
        $response = $this->actingAs($this->employee1, 'sanctum')->putJson("/api/follow-ups/{$followUp->id}", [
            'remarks' => 'Attempting to overwrite admin notes',
        ]);

        $response->assertStatus(403);
    }

    /** 12. Employee cannot edit follow-ups after lead is reassigned away */
    public function test_employee_cannot_edit_follow_ups_after_lead_is_reassigned(): void
    {
        // Employee 1 creates a follow up
        $followUp = FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Old note before transfer',
            'created_by' => $this->employee1->id,
        ]);

        // Reassign lead 1 to employee 2
        $this->lead1->update(['assigned_to' => $this->employee2->id]);

        // Employee 1 tries to edit the follow up
        $response = $this->actingAs($this->employee1, 'sanctum')->putJson("/api/follow-ups/{$followUp->id}", [
            'remarks' => 'Trying to edit after transfer',
        ]);

        $response->assertStatus(403);
    }

    /** 13. Employee cannot delete follow-ups */
    public function test_employee_cannot_delete_follow_ups(): void
    {
        $followUp = FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Remark to test deletion denial',
            'created_by' => $this->employee1->id,
        ]);

        $response = $this->actingAs($this->employee1, 'sanctum')->deleteJson("/api/follow-ups/{$followUp->id}");
        $response->assertStatus(403);
        $this->assertNotNull(FollowUp::find($followUp->id));
    }

    /** 14. Admin can edit and delete follow-ups */
    public function test_admin_can_edit_and_delete_follow_ups(): void
    {
        $followUp = FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'Created by employee',
            'created_by' => $this->employee1->id,
        ]);

        // Admin updates it
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/follow-ups/{$followUp->id}", [
                'remarks' => 'Amended by Admin.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.remarks', 'Amended by Admin.');

        // Admin deletes it
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/follow-ups/{$followUp->id}")
            ->assertStatus(200);

        $this->assertNull(FollowUp::find($followUp->id));
    }

    /** 15. Invalid lead IDs and dates return 422 */
    public function test_invalid_lead_ids_and_dates_return_422(): void
    {
        // Invalid lead ID
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/follow-ups', [
            'lead_id' => 99999,
            'follow_up_date' => '2026-11-04',
            'remarks' => 'Valid remarks',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['lead_id']);

        // Invalid date format
        $response2 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/follow-ups', [
            'lead_id' => $this->lead1->id,
            'follow_up_date' => 'not-a-valid-date',
            'remarks' => 'Valid remarks',
        ]);
        $response2->assertStatus(422)->assertJsonValidationErrors(['follow_up_date']);
    }

    /** 16. Lead-specific follow-up history respects ownership */
    public function test_lead_specific_follow_up_history_respects_ownership(): void
    {
        FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now()->subHours(2),
            'remarks' => 'History item 1',
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => now(),
            'remarks' => 'History item 2',
            'created_by' => $this->admin->id,
        ]);

        // Admin can view lead 1 follow-up history
        $responseAdmin = $this->actingAs($this->admin, 'sanctum')->getJson("/api/leads/{$this->lead1->id}/follow-ups");
        $responseAdmin->assertStatus(200);
        $this->assertCount(2, $responseAdmin->json('data'));

        // Employee 1 can view their assigned lead's follow-up history
        $responseEmp1 = $this->actingAs($this->employee1, 'sanctum')->getJson("/api/leads/{$this->lead1->id}/follow-ups");
        $responseEmp1->assertStatus(200);
        $this->assertCount(2, $responseEmp1->json('data'));

        // Employee 2 cannot view lead 1's follow-up history
        $responseEmp2 = $this->actingAs($this->employee2, 'sanctum')->getJson("/api/leads/{$this->lead1->id}/follow-ups");
        $responseEmp2->assertStatus(403);
    }

    /** 17. Search, filters and pagination work correctly */
    public function test_search_filters_and_pagination_work(): void
    {
        FollowUp::create([
            'lead_id' => $this->lead1->id, // Acme Corporation, +91 98765 00001
            'follow_up_date' => '2026-11-01 10:00:00',
            'remarks' => 'Acme follow up 1',
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $this->lead1->id,
            'follow_up_date' => '2026-11-02 10:00:00',
            'remarks' => 'Acme follow up 2',
            'created_by' => $this->employee1->id,
        ]);

        FollowUp::create([
            'lead_id' => $this->lead2->id, // Global Logistics Inc
            'follow_up_date' => '2026-11-03 10:00:00',
            'remarks' => 'Logistics follow up',
            'created_by' => $this->employee2->id,
        ]);

        // Search by customer name
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/follow-ups?search=Acme');
        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('pagination.total'));

        // Filter by lead ID
        $response2 = $this->actingAs($this->admin, 'sanctum')->getJson("/api/follow-ups?lead_id={$this->lead2->id}");
        $response2->assertStatus(200);
        $this->assertEquals(1, $response2->json('pagination.total'));

        // Pagination
        $response3 = $this->actingAs($this->admin, 'sanctum')->getJson('/api/follow-ups?per_page=2&page=1');
        $response3->assertStatus(200);
        $this->assertCount(2, $response3->json('data'));
        $this->assertEquals(3, $response3->json('pagination.total'));
    }
}

