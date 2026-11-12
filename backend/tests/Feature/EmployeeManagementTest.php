<?php

namespace Tests\Feature;

use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $employee1;
    private User $employee2;

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
    }

    /** 1. Unauthenticated users cannot access employee management */
    public function test_unauthenticated_users_cannot_access_employee_management(): void
    {
        $this->getJson('/api/admin/employees')->assertStatus(401);
        $this->postJson('/api/admin/employees', [])->assertStatus(401);
        $this->getJson('/api/admin/employees/1')->assertStatus(401);
        $this->putJson('/api/admin/employees/1', [])->assertStatus(401);
    }

    /** 2. Employees receive 403 when accessing employee management */
    public function test_employees_receive_403_when_accessing_employee_management(): void
    {
        $this->actingAs($this->employee1, 'sanctum')->getJson('/api/admin/employees')->assertStatus(403);
        $this->actingAs($this->employee1, 'sanctum')->postJson('/api/admin/employees', [])->assertStatus(403);
        $this->actingAs($this->employee1, 'sanctum')->getJson("/api/admin/employees/{$this->employee2->id}")->assertStatus(403);
        $this->actingAs($this->employee1, 'sanctum')->putJson("/api/admin/employees/{$this->employee2->id}", [])->assertStatus(403);
    }

    /** 3. Admin can list employees */
    public function test_admin_can_list_employees(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/employees');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);

        $this->assertEquals(2, $response->json('pagination.total'));
    }

    /** 4. Admin cannot see Admin accounts in employee listing */
    public function test_admin_cannot_see_admin_accounts_in_employee_listing(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/employees');
        $response->assertStatus(200);

        $data = $response->json('data');
        foreach ($data as $item) {
            $this->assertEquals('employee', $item['role']);
            $this->assertNotEquals('admin', $item['role']);
            $this->assertNotEquals($this->admin->id, $item['id']);
        }
    }

    /** 5. Admin can create an employee */
    public function test_admin_can_create_an_employee(): void
    {
        $payload = [
            'name' => 'Vikram Verma',
            'email' => 'vikram.verma@leadflow.test',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/employees', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Vikram Verma')
            ->assertJsonPath('data.email', 'vikram.verma@leadflow.test')
            ->assertJsonPath('data.role', 'employee')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('users', [
            'email' => 'vikram.verma@leadflow.test',
            'role' => 'employee',
        ]);
    }

    /** 6. Duplicate email returns validation error */
    public function test_duplicate_email_returns_validation_error(): void
    {
        $payload = [
            'name' => 'Duplicate Employee',
            'email' => 'rahul.sharma@leadflow.test', // already taken
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/employees', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** 7. Invalid employee data returns 422 */
    public function test_invalid_employee_data_returns_422(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/employees', [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123', // too short
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    /** 8. Admin can view employee details */
    public function test_admin_can_view_employee_details(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson("/api/admin/employees/{$this->employee1->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.id', $this->employee1->id)
            ->assertJsonPath('data.name', 'Rahul Sharma')
            ->assertJsonPath('data.email', 'rahul.sharma@leadflow.test');
    }

    /** 9. Admin can update employee details */
    public function test_admin_can_update_employee_details(): void
    {
        $payload = [
            'name' => 'Rahul S. Sharma',
            'email' => 'rahul.updated@leadflow.test',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", $payload);
        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Rahul S. Sharma')
            ->assertJsonPath('data.email', 'rahul.updated@leadflow.test');

        $this->assertDatabaseHas('users', [
            'id' => $this->employee1->id,
            'name' => 'Rahul S. Sharma',
            'email' => 'rahul.updated@leadflow.test',
        ]);
    }

    /** 10. Admin can reset employee passwords */
    public function test_admin_can_reset_employee_passwords(): void
    {
        $payload = [
            'password' => 'brandnewpass123',
            'password_confirmation' => 'brandnewpass123',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", $payload);
        $response->assertStatus(200);

        $this->employee1->refresh();
        $this->assertTrue(Hash::check('brandnewpass123', $this->employee1->password));
    }

    /** 11. Empty password during editing does not change the existing password */
    public function test_empty_password_during_editing_does_not_change_existing_password(): void
    {
        $originalHash = $this->employee1->password;

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", [
            'name' => 'Name Change Only',
            'password' => '',
            'password_confirmation' => '',
        ]);

        $response->assertStatus(200);
        $this->employee1->refresh();
        $this->assertEquals($originalHash, $this->employee1->password);
    }

    /** 12. Admin can deactivate an employee */
    public function test_admin_can_deactivate_an_employee(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", [
            'is_active' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('users', [
            'id' => $this->employee1->id,
            'is_active' => false,
        ]);
    }

    /** 13. Deactivated employee cannot log in */
    public function test_deactivated_employee_cannot_log_in(): void
    {
        $this->employee1->update(['is_active' => false]);

        $response = $this->postJson('/api/login', [
            'email' => 'rahul.sharma@leadflow.test',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Your account is deactivated. Please contact your system administrator.');
    }

    /** 14. Admin can reactivate an employee */
    public function test_admin_can_reactivate_an_employee(): void
    {
        $this->employee1->update(['is_active' => false]);

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", [
            'is_active' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_active', true);

        // Can log in again
        $loginRes = $this->postJson('/api/login', [
            'email' => 'rahul.sharma@leadflow.test',
            'password' => 'password123',
        ]);
        $loginRes->assertStatus(200);
    }

    /** 15. Employee role cannot be changed through the API */
    public function test_employee_role_cannot_be_changed(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", [
            'role' => 'admin', // attempted privilege escalation
        ]);

        $response->assertStatus(200);
        $this->employee1->refresh();
        $this->assertEquals('employee', $this->employee1->role);
    }

    /** 16. Existing leads remain intact after employee deactivation */
    public function test_existing_leads_remain_intact_after_employee_deactivation(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Intact Lead Test',
            'phone' => '+91 99999 00001',
            'status' => 'interested',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        // Deactivate employee
        $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", [
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'assigned_to' => $this->employee1->id,
        ]);
    }

    /** 17. Existing follow-ups remain intact after employee deactivation */
    public function test_existing_follow_ups_remain_intact_after_employee_deactivation(): void
    {
        $lead = Lead::create([
            'customer_name' => 'Follow Up Lead Test',
            'phone' => '+91 99999 00002',
            'status' => 'new',
            'assigned_to' => $this->employee1->id,
            'created_by' => $this->admin->id,
        ]);

        $followUp = FollowUp::create([
            'lead_id' => $lead->id,
            'follow_up_date' => now(),
            'remarks' => 'Pre-deactivation follow up',
            'created_by' => $this->employee1->id,
        ]);

        // Deactivate employee
        $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/employees/{$this->employee1->id}", [
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('follow_ups', [
            'id' => $followUp->id,
            'created_by' => $this->employee1->id,
        ]);
    }

    /** 18. Deactivated employees do not appear in assignment dropdown data */
    public function test_deactivated_employees_cannot_be_assigned_new_leads(): void
    {
        // Deactivate employee 1
        $this->employee1->update(['is_active' => false]);

        // Try assigning a new lead to employee 1 (validation should reject because assigned_to must be active)
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/leads', [
            'customer_name' => 'Assign Inactive Lead',
            'phone' => '+91 99999 00003',
            'assigned_to' => $this->employee1->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_to']);
    }

    /** 19. Employee cannot modify another employee's account */
    public function test_employee_cannot_modify_another_employees_account(): void
    {
        $response = $this->actingAs($this->employee1, 'sanctum')->putJson("/api/admin/employees/{$this->employee2->id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertStatus(403);
    }

    /** 20. Password and remember token are never exposed in API responses */
    public function test_password_and_remember_token_are_never_exposed(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson("/api/admin/employees/{$this->employee1->id}");
        $response->assertStatus(200);

        $json = $response->json();
        $this->assertArrayNotHasKey('password', $json['data']);
        $this->assertArrayNotHasKey('remember_token', $json['data']);
    }
}

