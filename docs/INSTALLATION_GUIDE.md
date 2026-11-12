# LeadFlow — Installation & Local Deployment Guide

## 1. System Requirements & Prerequisites

Before setting up the LeadFlow project on your local machine, ensure the following tools are installed:

- **PHP:** Version 8.2 or higher with extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `curl`.
- **Composer:** Version 2.x (PHP dependency manager).
- **Node.js:** Version 18.x or 20.x LTS.
- **NPM:** Version 9.x or 10.x.
- **MySQL Database Server:** MySQL 8.0+ or MariaDB 10.4+.
- **Git:** Version 2.30+.

---

## 2. Step-by-Step Installation Procedure

### Step 2.1: Clone the Repository & Workspace Structure
```bash
cd C:\laravel
git clone <repository-url> LeadFlow
cd LeadFlow
```
Directory structure:
```text
LeadFlow/
├── backend/          # Laravel 12 API Project
├── frontend/         # React 19 + Vite Application
└── docs/             # Technical Documentation
```

---

### Step 2.2: Backend Configuration (Laravel)

1. **Navigate to the backend directory:**
   ```bash
   cd C:\laravel\LeadFlow\backend
   ```

2. **Install PHP Dependencies:**
   ```bash
   composer install
   ```

3. **Configure Environment File:**
   Copy the sample `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Generate Application Key:**
   ```bash
   php artisan key:generate
   ```

5. **Configure MySQL Database Connection:**
   Open `.env` in a text editor and update the database credentials:
   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=leadflow_db
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   ```

6. **Create the MySQL Database:**
   Using the MySQL command line, MySQL Workbench, or phpMyAdmin:
   ```sql
   CREATE DATABASE IF NOT EXISTS leadflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

7. **Run Database Migrations & Seeders:**
   ```bash
   php artisan migrate:fresh --seed
   ```
   *This command creates the `users`, `leads`, and `follow_ups` tables and populates them with sample Admin, Employee, Lead, and Follow-Up records.*

8. **Start the Laravel API Server:**
   ```bash
   php artisan serve
   ```
   *The backend REST API is now live at: `http://127.0.0.1:8000`*

---

### Step 2.3: Frontend Configuration (React + Vite)

1. **Open a new terminal window and navigate to the frontend directory:**
   ```bash
   cd C:\laravel\LeadFlow\frontend
   ```

2. **Install Node Dependencies:**
   ```bash
   npm install
   ```

3. **Verify API Base URL Configuration:**
   Inspect `frontend/src/services/api.js`. It defaults to:
   ```javascript
   baseURL: 'http://127.0.0.1:8000/api'
   ```
   *(Ensure the port matches your running Laravel server).*

4. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```
   *The frontend single-page application is now running at: `http://localhost:5173`*

---

## 3. Seeded Accounts for Evaluation & Demonstration

The database seeder provisions three default accounts:

| Role | Name | Email Address | Password | Intended Test Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | LeadFlow Admin | `admin@leadflow.test` | `password123` | Full visibility, assigning leads, deleting leads, employee management |
| **Employee 1** | Rahul Sharma | `rahul.sharma@leadflow.test` | `password123` | Managing assigned leads (Aarav Mehta, Vikram Singhania), logging calls |
| **Employee 2** | Priya Patel | `priya.patel@leadflow.test` | `password123` | Managing assigned leads (Sunita Rao, Deepak Verma), logging calls |

---

## 4. Running Verification Test Commands

To verify full system integrity on the command line:

```bash
# Run backend test suite
cd C:\laravel\LeadFlow\backend
php artisan test

# Run frontend build
cd C:\laravel\LeadFlow\frontend
npm run build
```
Both commands should complete with zero errors.

