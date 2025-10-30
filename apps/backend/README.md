# PatternCrafter Backend (FastAPI)

FastAPI backend providing authentication (JWT), roles, tasks, templates (categories), annotation submission, and admin stats, now backed by MongoDB (Motor driver).

## Features

- Users with roles: `admin`, `task_manager`, `user`
- Register and login (JWT bearer tokens)
- Templates (aka categories): list/get/create (admin/task_manager)
- Tasks: list (all, by template, or mine), create (admin/task_manager), assign to a single user only
- Annotations: submit results for a task, list your own; marks task completed
- Admin: stats and role management
- CORS enabled for Vite dev ports

## Quickstart (Windows PowerShell)

1. Create and activate venv:

```powershell
cd "apps/backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Configure environment (optional):

````powershell
```powershell
 # Set DATABASE_URL to your Mongo connection string, e.g.
 # DATABASE_URL=mongodb://localhost:27017/patterncrafter
# Edit .env if needed
````

3. Seed default accounts:

```powershell
python -m app.seed
# Creates:
#  admin@example.com / admin123 (admin)
#  manager@example.com / manager123 (task_manager)
```

4. Run the API:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Or from repo root using npm:

```powershell
npm run dev:api
```

## Endpoints

- Auth
  - POST /auth/register
  - POST /auth/login (OAuth2 password form fields: username, password)
- Templates
  - GET /api/templates
  - GET /api/templates/{id}
  - POST /api/templates (admin or task_manager)
- Tasks
  - GET /api/tasks?templateId=...&mine=true
  - GET /api/templates/{id}/tasks
  - POST /api/tasks (admin or task_manager)
  - POST /api/tasks/{task_id}/assign?user_id=... (admin or task_manager)
- Annotations
  - GET /api/annotations (users see their own; admin/manager see all)
  - POST /api/annotations
- Admin
  - GET /admin/stats
  - PATCH /admin/users/{user_id}/role?role=admin|task_manager|user

## Frontend integration

- Portal login/register now call backend at `http://localhost:8000` by default.
- Conversational AI app can switch to backend by setting env variables:
  - VITE_API_MODE=remote
  - VITE_API_BASE_URL=http://localhost:8000

## Notes

- MongoDB is used via Motor. Ensure your MongoDB instance is reachable at `DATABASE_URL`.
- Collections and indexes are created on startup.
