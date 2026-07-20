# Tito CRM backend

Django REST Framework backend for the perfume-shop admin dashboard. SQLite is used for local development.

## Run locally

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API starts at `http://127.0.0.1:8000/api/`. The development frontend origin (`localhost:5173`) is already allowed by CORS.

## Authentication

All business endpoints require `Authorization: Bearer <access-token>`. Create the first account through `POST /api/auth/register/` or create an admin with `python manage.py createsuperuser`. Login is `POST /api/auth/login/` with `username` and `password`; use `/api/auth/refresh/` to renew access and `/api/auth/logout/` to blacklist a refresh token.

## Core endpoints

- `GET /api/dashboard/?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `/api/perfumes/`, `/api/customers/`, `/api/stock-ins/`, `/api/sales/`
- `/api/debts/`, `/api/payables/`, `/api/incomes/`, `/api/expenses/`, `GET|PUT /api/settings/`
- `POST /api/debts/{id}/payment/` and `POST /api/payables/{id}/payment/`

Creating a stock receipt increases inventory and records a purchase expense. Creating or deleting a sale adjusts inventory; credit sales create customer debt, while paid sales create income. These changes are executed in database transactions.

Responses and requests use the exact field names in `src/types/index.ts`, for example `firmaNomi`, `perfumeId`, `qolganQarz`, `tarix` and `darkMode`. Routes belonging to the Django business application are declared in `store/urls.py`; the project routes include it at `/api/`.
