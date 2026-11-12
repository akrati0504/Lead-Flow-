# LeadFlow — Automated & Manual Testing Documentation

## 1. Testing Methodology & Strategy

LeadFlow's testing strategy utilizes a multi-tiered approach:
1. **Automated Unit & Feature Testing:** Built using Laravel's testing suite (`PHPUnit` / `Pest`) against an in-memory SQLite / test database with `RefreshDatabase`.
2. **Role Authorization Matrix Tests:** Verifies that horizontal and vertical privilege escalation attempts return `HTTP 403 Forbidden`.
3. **Frontend Build Verification:** Verified via Vite's production bundling engine (`npm run build`).
4. **Code Quality & Linter Auditing:** Static code analysis using `oxlint` (`npm run lint`).
5. **Manual Scenario Verification:** End-to-end verification of user flows, modals, and edge cases.

---

## 2. Automated Backend Test Suite Results

All test suites execute cleanly via `php artisan test`:

```text
   PASS  Tests\Unit\ExampleTest
  ✓ that true is true

   PASS  Tests\Feature\DashboardTest (14 tests)
  ✓ unauthenticated users cannot access dashboard endpoints
  ✓ admin can retrieve system wide dashboard statistics
  ✓ employee sees only assigned leads in dashboard statistics
  ✓ lead status counts are correct
  ✓ follow ups due today are counted correctly
  ✓ overdue follow ups are counted correctly
  ✓ upcoming follow ups within 7 days are counted correctly
  ✓ null next follow up dates are excluded
  ✓ admin can retrieve all dashboard follow ups
  ✓ employee cannot retrieve other employees follow ups
  ✓ admin can retrieve all recent leads
  ✓ employee sees only assigned recent leads
  ✓ invalid period returns 422
  ✓ empty database returns zero counts and empty lists

   PASS  Tests\Feature\EmployeeManagementTest (20 tests)
  ✓ unauthenticated users cannot access employee management
  ✓ employees receive 403 when accessing employee management
  ✓ admin can list employees
  ✓ admin cannot see admin accounts in employee listing
  ✓ admin can create an employee
  ✓ duplicate email returns validation error
  ✓ invalid employee data returns 422
  ✓ admin can view employee details
  ✓ admin can update employee details
  ✓ admin can reset employee passwords
  ✓ empty password during editing does not change existing password
  ✓ admin can deactivate an employee
  ✓ deactivated employee cannot log in
  ✓ admin can reactivate an employee
  ✓ employee role cannot be changed
  ✓ existing leads remain intact after employee deactivation
  ✓ existing follow ups remain intact after employee deactivation
  ✓ deactivated employees cannot be assigned new leads
  ✓ employee cannot modify another employees account
  ✓ password and remember token are never exposed

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response

   PASS  Tests\Feature\FollowUpCrudTest (17 tests)
  ✓ unauthenticated user cannot access follow up apis
  ✓ admin can view all follow ups
  ✓ employee can view only follow ups for assigned leads
  ✓ admin can create a follow up
  ✓ employee can create a follow up for assigned lead
  ✓ employee cannot create follow up for another employees lead
  ✓ employee cannot create follow up for unassigned lead
  ✓ created by is automatically set to authenticated user
  ✓ employee cannot change lead id or created by
  ✓ employee can edit own follow up for assigned lead
  ✓ employee cannot edit another users follow up
  ✓ employee cannot edit follow ups after lead is reassigned
  ✓ employee cannot delete follow ups
  ✓ admin can edit and delete follow ups
  ✓ invalid lead ids and dates return 422
  ✓ lead specific follow up history respects ownership
  ✓ search filters and pagination work

   PASS  Tests\Feature\LeadCrudTest (15 tests)
  ✓ unauthenticated user cannot access lead apis
  ✓ admin can retrieve all leads
  ✓ employee can retrieve only their assigned leads
  ✓ admin can create a lead
  ✓ employee creates lead assigned to themselves
  ✓ employee cannot assign lead to another employee
  ✓ admin can assign and reassign leads
  ✓ employee cannot view another employees lead
  ✓ employee cannot update another employees lead
  ✓ employee cannot delete leads
  ✓ admin can update and delete leads
  ✓ invalid lead status returns 422
  ✓ invalid employee assignment returns 422
  ✓ search and status filters work
  ✓ pagination returns correct results

------------------------------------------------------
Total: 68 passed (246 assertions)
------------------------------------------------------
```

---

## 3. Manual Functional Test Matrix

| Test Case ID | Test Scenario | Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Valid Admin Login | Enter `admin@leadflow.test` / `password123` | Redirects to `/admin/dashboard` with Admin pill | Matches expected | **PASS** |
| **TC-AUTH-02** | Valid Employee Login | Enter `rahul.sharma@leadflow.test` / `password123` | Redirects to `/employee/dashboard` with Employee pill | Matches expected | **PASS** |
| **TC-AUTH-03** | Inactive Account Login | Deactivate employee, then submit login | Rejection with HTTP 403: "Your account is deactivated..." | Matches expected | **PASS** |
| **TC-AUTH-04** | Invalid Password | Enter incorrect password | Rejection with HTTP 401: "Invalid credentials" | Matches expected | **PASS** |
| **TC-LEAD-01** | Admin Lead Creation | Admin creates lead and assigns to Employee | Lead created, assigned employee shown | Matches expected | **PASS** |
| **TC-LEAD-02** | Employee Lead Creation | Employee creates lead | Assignment field hidden; auto-assigned to self | Matches expected | **PASS** |
| **TC-LEAD-03** | Lead Deletion Barrier | Employee attempts to delete lead | Delete button hidden; direct API call gives 403 | Matches expected | **PASS** |
| **TC-LEAD-04** | Admin Lead Reassignment| Admin selects another staff member | Lead reassigned; original staff loses access | Matches expected | **PASS** |
| **TC-FLW-01** | Create Follow-Up | Add follow-up for assigned lead | Activity logged; appears in lead history timeline | Matches expected | **PASS** |
| **TC-FLW-02** | Schedule Filter Tabs | Click `Due Today`, `Upcoming`, `Overdue` | Follow-ups dynamically filtered based on deadline | Matches expected | **PASS** |
| **TC-FLW-03** | Immutable Fields | Edit follow-up remarks | `lead_id` and creator remain immutable | Matches expected | **PASS** |
| **TC-EMP-01** | Admin Employee Management| Admin adds new employee | New account appears in staff directory | Matches expected | **PASS** |
| **TC-EMP-02** | Password Reset | Admin enters new password for employee | Employee can log in with new password | Matches expected | **PASS** |
| **TC-EMP-03** | Deactivation Safety | Admin deactivates employee with active leads | Account marked Inactive; all historical leads/follow-ups preserved intact | Matches expected | **PASS** |

---

## 4. Frontend Compilation & Linting Audit

### Production Build Verification
Command: `npm run build` inside `frontend/`
- **Output:** Built in **1.51s** / **4.78s**.
- **Chunks:**
  - `dist/index.html`: `0.45 kB`
  - `dist/assets/bootstrap-icons.woff2`: `134.01 kB`
  - `dist/assets/index.css`: `311.25 kB`
  - `dist/assets/index.js`: `420.82 kB`
- **Errors:** `0 Errors`

### Static Code Analysis
Command: `npm run lint` inside `frontend/`
- **Result:** `0 errors` (18 non-breaking react linter hints on effects).

