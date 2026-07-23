# Tito CRM backend

Django REST Framework backend for the perfume-shop admin dashboard. SQLite is used for local development.

## Run locally

```powershell
cd backend
python -m venv venv
venv\scripts\activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API starts at `http://127.0.0.1:8000/api/`. The development frontend origin (`localhost:5173`) is already allowed by CORS.

## Authentication and roles

All business endpoints require `Authorization: Bearer <access-token>`. There is no public self-registration — create the first super admin with `python manage.py createsuperuser`. Login is `POST /api/auth/login/` with `username` and `password`; use `/api/auth/refresh/` to renew access and `/api/auth/logout/` to blacklist a refresh token.

A logged-in Django superuser is the **super admin**: only they can manage employee (`hodim`) accounts via `/api/employees/` and read the audit trail via `/api/activity-logs/` (both endpoints reject non-superusers with 403). Every employee account the super admin creates through `/api/employees/` has `is_staff=False, is_superuser=False` and full access to the regular business endpoints below — every create/update/delete they make is recorded in `ActivityLog` with their user, so the super admin can see exactly what each employee changed and when.

## Core endpoints

- `GET /api/dashboard/?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `/api/perfumes/`, `/api/customers/`, `/api/stock-ins/`, `/api/sales/`
- `/api/debts/`, `/api/payables/`, `/api/incomes/`, `/api/expenses/`, `GET|PUT /api/settings/`
- `POST /api/debts/{id}/payment/` and `POST /api/payables/{id}/payment/`
- `/api/employees/` and `/api/activity-logs/` (super admin only)

Creating a stock receipt increases inventory and records a purchase expense. Creating or deleting a sale adjusts inventory; credit sales create customer debt, while paid sales create income. These changes are executed in database transactions.

Responses and requests use the exact field names in `src/types/index.ts`, for example `firmaNomi`, `perfumeId`, `qolganQarz`, `tarix` and `darkMode`. Routes belonging to the Django business application are declared in `store/urls.py`; the project routes include it at `/api/`.
