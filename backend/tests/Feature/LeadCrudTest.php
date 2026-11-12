<?php

namespace Tests\Feature;

use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $employee1;
    private User $employee2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::firstOrCreate(
            ['email' => 'admin@leadflow.test'],
            [
                'name' => 'LeadFlow Admin',
                'password' => 'password123',
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        $this->employee1 = User::firstOrCreate(
            ['email' => 'rahul.sharma@leadflow.test'],
            [
                'name' => 'Rahul Sharma',
                'password' => 'password123',
                'role' => 'employee',
                'is_active' => true,
            ]
        );

        $this->employee2 = User::firstOrCreate(
            ['email' => 'priya.patel@leadflow.test'],
            [
                'name' => 'Priya Patel',
                'password' => 'password123',
                'role' => 'employee',
                'is_active' => true,
            ]
        );
    }

    /** 1. Unauthenticated user cannot access lead APIs */
    public function test_unauthenticated_user_cannot_access_lead_apis(): void
    {
        $this->getJson('/api/leads')->assertStatus(401);
        $this->postJson('/api/leads', [])->assertStatus(401);
        $this->getJson('/api/leads/1')->assertStatus(401);
        $this->putJson('/api/leads/1', [])->assertStatus(401);
        $this->deleteJson('/api/leads/1')->assertStatus(401);
    }

    /** 2. Admin can retrieve all leads */
    public function test_admin_can_retrieve_all_leads(): void
    {
        Lead::create([
            'customer_name' => 'Sample Lead A',
            'phone' => '+91 91111 22222',
            'status' => 'new',
            'created_by' => $this->admin->id,
        ]);
        Lead::create([
            'customer_name' => 'Sample Lead B',
            'phone' => '+91 93333 44444',
            'status' => 'contacted',
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/leads');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);
        $this->assertTrue($response->json('pagination.total') >= 2);
    }

    /** 3. Employee can retrieve only their assigned leads */
    public function test_employee_can_retrieve_only_their_assigned_leads(): void
    {
        $response = $this->actingAs($this->employee1, 'sanctum')->getJson('/api/leads');
        $response->assertStatus(200);

        $leads = $response->json('data');
        foreach ($leads as $lead) {
            $this->assertEquals($this->employee1->id, $lead['assigned_to']);
        }
    }

    /** 4. Admin can create a lead (with assignment or unassigned) */
    public function test_admin_can_create_a_lead(): void
    {
        $payload = [
            'customer_name' => 'Enterprise Client Ltd',
            'phone' => '+91 91234 56789',
            'email' => 'client@enterprise.com',
            'company_name' => 'Enterprise Client Ltd',
            'description' => 'Looking for CRM system.',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/leads', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.customer_name', 'Enterprise Client Ltd')
            ->assertJsonPath('data.assigned_to', $this->employee1->id)
            ->assertJsonPath('data.created_by', $this->admin->id);

        $createdId = $response->json('data.id');
        Lead::find($createdId)?->delete();
    }

    /** 5. Employee can create a lead assigned automatically to themselves */
    public function test_employee_creates_lead_assigned_to_themselves(): void
    {
        $payload = [
            'customer_name' => 'Employee Added Lead',
            'phone' => '+91 99887 76655',
            'email' => 'employee.lead@test.com',
            'company_name' => 'Self Acquired',
            'status' => 'new',
            // Attempt to assign to employee2
            'assigned_to' => $this->employee2->id,
        ];

        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/leads', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.customer_name', 'Employee Added Lead')
            // Crucial: Must be assigned to employee1 (self), ignoring payload
            ->assertJsonPath('data.assigned_to', $this->employee1->id)
            ->assertJsonPath('data.created_by', $this->employee1->id);

        $createdId = $response->json('data.id');
        Lead::find($createdId)?->delete();
    }

    /** 6. Employee cannot assign a lead to another employee */
    public function test_employee_cannot_assign_lead_to_another_employee(): void
    {
        $payload = [
            'customer_name' => 'Test Disallowed Assign',
            'phone' => '+91 98888 77777',
            'assigned_to' => $this->employee2->id,
        ];

        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/leads', $payload);
        $response->assertStatus(201);
        // It must NOT be assigned to employee2
        $this->assertEquals($this->employee1->id, $response->json('data.assigned_to'));

        $createdId = $response->json('data.id');
        Lead::find($createdId)?->delete();
    }

    /** 7. Admin can assign and reassign leads */
    public function test_admin_can_assign_and_reassign_leads(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Reassignment Test Lead',
            'phone' => '+91 90000 11111',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Reassign to employee2
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/leads/{$lead->id}", [
                'assigned_to' => $this->employee2->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.assigned_to', $this->employee2->id);

        // Reassign to unassigned (null)
        $response2 = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/leads/{$lead->id}", [
                'assigned_to' => null,
            ]);

        $response2->assertStatus(200)
            ->assertJsonPath('data.assigned_to', null);

        $lead->delete();
    }

    /** 8. Employee cannot view another employee's lead by ID */
    public function test_employee_cannot_view_another_employees_lead(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Private to Employee 2',
            'phone' => '+91 92222 33333',
            'status' => 'new',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        // Employee 1 attempts to view
        $response = $this->actingAs($this->employee1, 'sanctum')->getJson("/api/leads/{$lead->id}");
        $response->assertStatus(403);

        $lead->delete();
    }

    /** 9. Employee cannot update another employee's lead */
    public function test_employee_cannot_update_another_employees_lead(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Private to Employee 2',
            'phone' => '+91 92222 33333',
            'status' => 'new',
            'assigned_to' => $this->employee2->id,
            'created_by' => $this->admin->id,
        ]);

        // Employee 1 attempts to update
        $response = $this->actingAs($this->employee1, 'sanctum')
            ->putJson("/api/leads/{$lead->id}", [
                'customer_name' => 'Hacked Name',
            ]);
        $response->assertStatus(403);

        $lead->delete();
    }

    /** 10. Employee cannot delete leads */
    public function test_employee_cannot_delete_leads(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Assigned to Employee 1',
            'phone' => '+91 93333 44444',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->employee1->id,
        ]);

        // Employee 1 attempts to delete
        $response = $this->actingAs($this->employee1, 'sanctum')->deleteJson("/api/leads/{$lead->id}");
        $response->assertStatus(403);

        $lead->delete();
    }

    /** 11. Admin can update and delete leads */
    public function test_admin_can_update_and_delete_leads(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Admin Test Target',
            'phone' => '+91 94444 55555',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Update
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/leads/{$lead->id}", [
                'customer_name' => 'Updated by Admin',
                'status' => 'contacted',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.customer_name', 'Updated by Admin')
            ->assertJsonPath('data.status', 'contacted');

        // Delete
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/leads/{$lead->id}")
            ->assertStatus(200);

        $this->assertNull(Lead::find($lead->id));
    }

    /** 12. Invalid lead status returns 422 */
    public function test_invalid_lead_status_returns_422(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/leads', [
            'customer_name' => 'Invalid Status Test',
            'phone' => '+91 95555 66666',
            'status' => 'not_a_valid_status',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** 13. Invalid employee assignment returns 422 */
    public function test_invalid_employee_assignment_returns_422(): void
    {
        // Try assigning to a non-existent ID or non-employee user
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/leads', [
            'customer_name' => 'Invalid Assignment Test',
            'phone' => '+91 96666 77777',
            'assigned_to' => 99999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_to']);
    }

    /** 14. Search and status filters work correctly */
    public function test_search_and_status_filters_work(): void
    {
        $lead = Lead::create([
            'customer_name' => 'UniqueSearchStringXYZ',
            'phone' => '+91 97777 88888',
            'status' => 'interested',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Search by name
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/leads?search=UniqueSearchStringXYZ');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('UniqueSearchStringXYZ', $response->json('data.0.customer_name'));

        // Filter by status
        $response2 = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/leads?search=UniqueSearchStringXYZ&status=interested');
        $response2->assertStatus(200);
        $this->assertCount(1, $response2->json('data'));

        // Filter by wrong status
        $response3 = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/leads?search=UniqueSearchStringXYZ&status=lost');
        $response3->assertStatus(200);
        $this->assertCount(0, $response3->json('data'));

        $lead->delete();
    }

    /** 15. Pagination returns correct results */
    public function test_pagination_returns_correct_results(): void
    {
        Lead::create([
            'customer_name' => 'Pagination Lead 1',
            'phone' => '+91 91000 00001',
            'status' => 'new',
            'created_by' => $this->admin->id,
        ]);
        Lead::create([
            'customer_name' => 'Pagination Lead 2',
            'phone' => '+91 91000 00002',
            'status' => 'new',
            'created_by' => $this->admin->id,
        ]);
        Lead::create([
            'customer_name' => 'Pagination Lead 3',
            'phone' => '+91 91000 00003',
            'status' => 'new',
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/leads?per_page=2&page=1');

        $response->assertStatus(200)
            ->assertJsonPath('pagination.per_page', 2)
            ->assertJsonPath('pagination.current_page', 1);

        $this->assertCount(2, $response->json('data'));
    }
}
