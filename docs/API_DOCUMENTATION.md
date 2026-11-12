# LeadFlow — REST API Documentation

## 1. Overview & Conventions

LeadFlow's backend exposes a RESTful JSON API.

- **Base URL:** `http://127.0.0.1:8000/api`
- **Request Headers:**
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Bearer <sanctum_personal_access_token>` (for all protected endpoints)
- **Standard HTTP Response Codes:**
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `403 Forbidden`: Authenticated user lacks permission for this role or action.
  - `404 Not Found`: Target resource does not exist.
  - `422 Unprocessable Entity`: Form validation failed (returns array of field errors).

---

## 2. Authentication Endpoints

### 2.1 Login
`POST /api/login` (Public)

Authenticates user credentials, confirms active status, and returns a Sanctum access token.

- **Request Body:**
```json
{
  "email": "admin@leadflow.test",
  "password": "password123"
}
```
- **Validation Rules:**
  - `email`: required, email format
  - `password`: required, string
- **Success Response (200 OK):**
```json
{
  "message": "Login successful.",
  "token": "1|ra78VnQyQZ9...",
  "user": {
    "id": 1,
    "name": "LeadFlow Admin",
    "email": "admin@leadflow.test",
    "role": "admin",
    "is_active": true
  }
}
```
- **Deactivated Error Response (403 Forbidden):**
```json
{
  "message": "Your account is deactivated. Please contact your system administrator."
}
```

---

### 2.2 Logout
`POST /api/logout` (auth:sanctum)

Revokes the caller's current Bearer token.

- **Success Response (200 OK):**
```json
{
  "message": "Logged out successfully."
}
```

---

### 2.3 Current Authenticated User
`GET /api/user` (auth:sanctum)

Returns the authenticated user's profile and active role.

- **Success Response (200 OK):**
```json
{
  "id": 2,
  "name": "Rahul Sharma",
  "email": "rahul.sharma@leadflow.test",
  "role": "employee",
  "is_active": true
}
```

---

## 3. Dashboard Endpoints

### 3.1 Dashboard Summary Statistics
`GET /api/dashboard/summary` (auth:sanctum)

Returns lead status distributions and follow-up metrics.
- **Role Scope:**
  - `admin`: Aggregate counts across the entire organization.
  - `employee`: Aggregate counts restricted to leads assigned to caller.
- **Success Response (200 OK):**
```json
{
  "data": {
    "leads": {
      "total": 5,
      "new": 1,
      "contacted": 1,
      "interested": 1,
      "converted": 1,
      "lost": 1
    },
    "follow_ups": {
      "due_today": 1,
      "overdue": 2,
      "upcoming_7_days": 1
    }
  }
}
```

---

### 3.2 Scheduled Dashboard Follow-Ups
`GET /api/dashboard/follow-ups` (auth:sanctum)

Returns scheduled follow-up items filtered by period.

- **Query Parameters:**
  - `period` (required): `today` | `upcoming` | `overdue`
  - `per_page` (optional): default 10
- **Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 3,
      "lead_id": 3,
      "follow_up_date": "2026-11-12T10:00:00.000000Z",
      "remarks": "Procurement team confirmed SLA review. Final sign-off scheduled.",
      "next_follow_up_date": "2026-11-17T15:30:00.000000Z",
      "lead": {
        "id": 3,
        "customer_name": "Vikram Singhania",
        "phone": "+91 97110 99887",
        "company_name": "Singhania Logistics",
        "status": "interested"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 10,
    "total": 1
  }
}
```

---

### 3.3 Recent Leads
`GET /api/dashboard/recent-leads` (auth:sanctum)

Returns the 5 most recent leads.

- **Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 5,
      "customer_name": "Neha Kapoor",
      "phone": "+91 98450 67890",
      "company_name": "RetailHub Systems",
      "status": "lost",
      "created_at": "2026-11-12T11:00:00.000000Z",
      "assigned_employee": null
    }
  ]
}
```

---

## 4. Lead Management Endpoints

### 4.1 List Leads
`GET /api/leads` (auth:sanctum)

- **Query Parameters:**
  - `search` (optional): search customer name, email, or phone
  - `status` (optional): `all`, `new`, `contacted`, `interested`, `converted`, `lost`
  - `assigned_to` (optional, admin only): employee user ID or `'unassigned'`
  - `page` (optional): integer (default 1)
  - `per_page` (optional): integer (default 10)
- **Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "customer_name": "Aarav Mehta",
      "phone": "+91 98765 43210",
      "email": "aarav.mehta@example.com",
      "company_name": "Apex Cloud Innovations",
      "description": "Interested in enterprise CRM migration.",
      "status": "new",
      "assigned_to": 2,
      "created_by": 1,
      "created_at": "2026-11-12T10:00:00.000000Z",
      "assigned_employee": {
        "id": 2,
        "name": "Rahul Sharma",
        "email": "rahul.sharma@leadflow.test"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 10,
    "total": 1
  }
}
```

---

### 4.2 Create Lead
`POST /api/leads` (auth:sanctum)

- **Request Body:**
```json
{
  "customer_name": "Karan Mehra",
  "phone": "+91 99887 76655",
  "email": "karan@example.com",
  "company_name": "Mehra Logistics",
  "description": "Looking for custom integration.",
  "status": "new",
  "assigned_to": 2
}
```
- **Validation Rules:**
  - `customer_name`: required, string, max:255
  - `phone`: required, string, max:255
  - `email`: nullable, email, max:255
  - `company_name`: nullable, string, max:255
  - `description`: nullable, string
  - `status`: nullable, in:new,contacted,interested,converted,lost
  - `assigned_to`: nullable, exists in `users` where `role='employee'` and `is_active=true`
- **Employee Rule:** If caller is Employee, `assigned_to` is automatically forced to their own user ID.
- **Success Response (201 Created)**

---

### 4.3 Get Lead Details
`GET /api/leads/{id}` (auth:sanctum)
- **Role Scope:** Admins can view any lead; Employees receive 403 Forbidden if not assigned to them.
- **Success Response (200 OK)**

---

### 4.4 Update Lead
`PUT|PATCH /api/leads/{id}` (auth:sanctum)
- **Validation Rules:** Same as create.
- **Role Scope:** Admins can update all fields and reassign `assigned_to`. Employees can update contact details/status of their assigned leads, but cannot reassign.
- **Success Response (200 OK)**

---

### 4.5 Delete Lead
`DELETE /api/leads/{id}` (auth:sanctum, Admin only)
- Permanently deletes the lead and cascades deletion of its follow-ups.
- **Employee Call:** Returns `403 Forbidden`.
- **Success Response (200 OK):**
```json
{
  "message": "Lead deleted successfully."
}
```

---

### 4.6 Lead Follow-Up History Timeline
`GET /api/leads/{leadId}/follow-ups` (auth:sanctum)
- Returns chronological list of all follow-ups logged for the specified lead.
- **Role Scope:** Allowed if Admin, or if Employee is assigned to the lead.
- **Success Response (200 OK)**

---

## 5. Follow-Up Management Endpoints

### 5.1 List Follow-Ups
`GET /api/follow-ups` (auth:sanctum)
- **Query Parameters:** `search`, `lead_id`, `created_by` (admin only), `page`, `per_page`
- **Role Scope:** Admins see all; Employees see follow-ups for assigned leads.
- **Success Response (200 OK)**

---

### 5.2 Create Follow-Up
`POST /api/follow-ups` (auth:sanctum)
- **Request Body:**
```json
{
  "lead_id": 1,
  "follow_up_date": "2026-11-12 14:30:00",
  "remarks": "Customer agreed to schedule product demo.",
  "next_follow_up_date": "2026-11-15 11:00:00"
}
```
- **Validation Rules:**
  - `lead_id`: required, exists:leads,id (and for Employee: must be assigned to them)
  - `follow_up_date`: required, date
  - `remarks`: required, string
  - `next_follow_up_date`: nullable, date, after_or_equal:follow_up_date
- **Success Response (201 Created)**

---

### 5.3 Update Follow-Up
`PUT|PATCH /api/follow-ups/{id}` (auth:sanctum)
- Updates `remarks`, `follow_up_date`, or `next_follow_up_date`.
- `lead_id` and `created_by` are immutable and cannot be changed.
- **Employee Rule:** Can only edit their own follow-up while the lead remains assigned to them.
- **Success Response (200 OK)**

---

### 5.4 Delete Follow-Up
`DELETE /api/follow-ups/{id}` (auth:sanctum, Admin only)
- Deletes individual follow-up record.
- **Employee Call:** Returns `403 Forbidden`.
- **Success Response (200 OK)**

---

## 6. Admin Employee Management Endpoints

All endpoints in this group require `auth:sanctum` and `role:admin`. If an employee calls them, Laravel responds with `403 Forbidden`.

### 6.1 List Employees
`GET /api/admin/employees`
- **Query Parameters:**
  - `search` (optional): name or email filter
  - `is_active` (optional): `true`, `false`, `1`, `0`
  - `page`, `per_page`
- **Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 2,
      "name": "Rahul Sharma",
      "email": "rahul.sharma@leadflow.test",
      "role": "employee",
      "is_active": true,
      "created_at": "2026-11-12T10:00:00.000000Z",
      "updated_at": "2026-11-12T10:00:00.000000Z"
    }
  ]
}
```

---

### 6.2 Create Employee
`POST /api/admin/employees`
- **Request Body:**
```json
{
  "name": "Amit Shah",
  "email": "amit.shah@leadflow.test",
  "password": "password123",
  "password_confirmation": "password123",
  "is_active": true
}
```
- **Validation Rules:**
  - `name`: required, string, max:255
  - `email`: required, email, unique:users,email
  - `password`: required, min:6, confirmed
  - `is_active`: boolean
- **Note:** The `role` is automatically forced to `'employee'`.
- **Success Response (201 Created)**

---

### 6.3 Update Employee / Reset Password / Toggle Active
`PUT|PATCH /api/admin/employees/{id}`
- **Request Body (All fields optional):**
```json
{
  "name": "Amit Shah",
  "email": "amit.shah@leadflow.test",
  "password": "newpassword123",
  "password_confirmation": "newpassword123",
  "is_active": false
}
```
- **Deactivation Effect:** Setting `is_active: false` immediately revokes login permissions and removes the employee from active lead assignment dropdowns, while fully preserving historical lead and follow-up foreign key records.
- **Success Response (200 OK)**

