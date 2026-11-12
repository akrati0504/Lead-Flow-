# LeadFlow — Project Overview

## 1. Introduction
**LeadFlow** is a modern, web-based Customer Relationship & Lead Management System developed as an **MCA (Master of Computer Applications) 2nd Year Mini Project**. The platform centralizes prospective customer acquisition, pipeline qualification, and scheduled interaction management for sales teams.

LeadFlow is built using an industry-standard decoupled architecture:
- **Backend:** Laravel 12 REST API with Laravel Sanctum token authentication and MySQL.
- **Frontend:** React 19 Single Page Application (SPA) with Vite 8 and Bootstrap 5.3.8.
- **Brand Aesthetic:** Professional modern CRM with `#434AFA` brand blue accenting.

---

## 2. Problem Statement
In conventional sales workflows, small-to-midsize businesses frequently suffer from:
1. **Scattered Prospect Data:** Inquiries collected via phone calls, emails, or marketing campaigns are kept in personal notebooks, fragmented spreadsheets, or chat logs, resulting in lost contacts and duplicate outreach.
2. **Missed Follow-Ups:** Inquiries go cold because sales agents lack systematic reminders for scheduled follow-ups, quotes, or demo calls.
3. **Absence of Accountability:** Sales managers lack visibility into which employee owns each lead, lead conversion rates, and current status distribution.
4. **Data Loss from Employee Attrition:** When a sales representative departs or account access is revoked, deleting records risks erasing entire customer interaction histories and active deal pipelines.

---

## 3. Project Objectives
1. **Centralize Inquiries:** Provide a single source of truth for prospective leads with customer contact information, company name, notes, and lifecycle stages (`new`, `contacted`, `interested`, `converted`, `lost`).
2. **Automate Follow-Up Tracking:** Log timestamped interaction remarks and schedule next touchpoints (`next_follow_up_date`) with proactive categorization (`Due Today`, `Upcoming (7 Days)`, `Overdue`).
3. **Enforce Role-Based Access Control (RBAC):** Provide tailored workspaces for System Administrators (full oversight, lead reassignment, staff management) and Sales Employees (self-assigned leads, daily call logging).
4. **Preserve Relational History:** Guarantee zero data loss when managing staff by replacing permanent user deletion with soft account deactivation (`is_active` flag).

---

## 4. Project Scope

### In-Scope Functional Modules
- **Authentication & Session Security:** Token-based authentication using Laravel Sanctum with automatic token expiration and inactive account login rejection.
- **Interactive Dashboards:** Real-time KPI summaries for lead pipeline stages and scheduled follow-up urgency, scoped system-wide for Admins and strictly per-assignee for Employees.
- **Lead Management:** Full CRUD operations, debounced multi-field search, status filtering, employee assignment, and unassigned lead filtering.
- **Follow-Up Management:** Chronological activity logging, status pill filters (`All`, `Today`, `Upcoming`, `Overdue`), and linked customer timelines.
- **Admin Staff Management:** Employee account creation, credential resets, profile editing, and instant account deactivation/reactivation.

### Deliberate Out-of-Scope Elements
To maintain clean academic focus and prevent architectural bloat:
- No third-party telephony/SMS gateways (focuses on CRM workflow logic).
- No payment processing/billing engines (post-conversion billing handled externally).
- No multi-tenant sharding (optimized for single-tenant corporate sales teams).

---

## 5. Comparison: Existing System vs. Proposed System

| Feature / Criteria | Existing Manual / Spreadsheet System | Proposed LeadFlow System |
| :--- | :--- | :--- |
| **Data Storage** | Disjointed Excel/CSV files or notebooks | Centralized, normalized MySQL relational database |
| **Security & Privacy** | Files shared via email, unprotected passwords | Token-based Sanctum Bearer authentication & bcrypt hashing |
| **Access Control** | Anyone with file link can edit or erase all rows | Strict RBAC (Admins oversee all; Employees see only assigned leads) |
| **Search & Filtering** | Manual Excel column filters | Fast debounced server-side search across names, emails, and phones |
| **Follow-Up Reminders** | Manual calendar reminders or forgotten notes | Automatic real-time status queries (`Today`, `Upcoming`, `Overdue`) |
| **Data Preservation** | Deleting a staff member's sheet erases customer records | Deactivation retains 100% of lead and follow-up foreign-key relationships |
| **User Experience** | Cluttered spreadsheet tables | Modern React 19 responsive interface with Bootstrap 5.3.8 |

---

## 6. Technology Stack Details

### Backend
- **Framework:** Laravel 12 (PHP 8.2+)
- **API Token Authentication:** Laravel Sanctum 4.x
- **ORM:** Eloquent ORM
- **Database Engine:** MySQL 8.0+ (InnoDB, `utf8mb4_unicode_ci`)
- **Testing:** PHPUnit / Pest Test Suite (68 automated test cases)

### Frontend
- **Framework:** React 19.x
- **Build Tool:** Vite 8.x
- **Routing:** React Router 7.x
- **Styling:** Bootstrap 5.3.8 & Bootstrap Icons 1.13.2
- **HTTP Client:** Axios 1.21.x with centralized interceptors

