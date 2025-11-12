# Project Structure – PatternCrafter

This document summarizes the current repository layout (branch: `backend_task`). Generated on 12 Nov 2025.

## Top-Level

```
PatternCrafter/
├── .editorconfig
├── .git/
├── .gitignore
├── README.md
├── ROLE_SEPARATION_UPDATE.md
├── backend/
├── docs/
├── frontend/
```

## Backend

```
backend/
├── .env
├── ANNOTATOR_TASK_TRACKING.md
├── auth.py
├── auth_routes.py
├── config.py
├── database.py
├── db_utils.py
├── docker-compose.yml
├── Dockerfile
├── invite_routes.py
├── main.py
├── mongo-init.js
├── notification_routes.py
├── project_routes.py
├── README.md
├── requirements.txt
├── routes.py
├── ROUTES_RESTRUCTURING.md
├── ROUTES_STRUCTURE.md
├── run.py
├── schemas.py
├── services/
│   └── __pycache__/
├── start.ps1
├── task_routes.py
├── test_api.py
├── user_routes.py
├── utils.py
├── venv/
└── __pycache__/
```

### Notes

- `database.py`: Mongo connection + collections (acts as singleton resource holder).
- `routes.py`: Aggregates feature routers under FastAPI.
- `schemas.py`: Pydantic models / DTOs.
- `task_routes.py`, `project_routes.py`, `invite_routes.py`, etc.: Feature endpoints.
- `db_utils.py`: Administrative/script utilities (creating sample data, stats).
- `test_api.py`: Manual smoke/API test script.

## Frontend

```
frontend/
├── dist/
├── index.html
├── node_modules/
├── package-lock.json
├── package.json
├── postcss.config.cjs
├── public/
├── README.md
├── src/
│   ├── api/
│   │   └── client.ts
│   ├── App.tsx
│   ├── auth/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── JsonView.tsx
│   │   ├── NavBar.tsx
│   │   └── NotificationBell.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── pages/
│   │   ├── AnnotationTasksPage.tsx
│   │   ├── AnnotatorCompletedTasksPage.tsx
│   │   ├── AssignQAPage.tsx
│   │   ├── AssignTaskPage.tsx
│   │   ├── CompletedTasksPage.tsx
│   │   ├── CreateTaskPage.tsx
│   │   ├── InProgressTasksPage.tsx
│   │   ├── InvitesPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ManageRolesPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── ProjectInvitesPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── QACompletedTasksPage.tsx
│   │   ├── QAPendingTasksPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ReturnedTasksPage.tsx
│   │   ├── TaskAnnotatePage.tsx
│   │   ├── TaskQAPage.tsx
│   │   ├── TaskViewPage.tsx
│   │   └── WelcomePage.tsx
│   ├── types.ts
│   └── vite-env.d.ts
├── tailwind.config.cjs
├── tsconfig.json
├── vite.config.ts
└── vite.config.ts.timestamp-1762104978999-ac9edcd0d8123.mjs
```

### Notes

- `src/api/client.ts`: Fetch wrapper (Facade for HTTP calls).
- `AuthContext.tsx`: React Context for auth state.
- `components/`: Reusable UI primitives.
- `pages/`: Route-level views aligned with backend features.

## Docs

```
docs/
├── designPatternReadme.md
├── design_patterns.txt
└── proj_structure.md (this file)
```

## High-Level Layering

```
Presentation: frontend/src/pages/*, components/*
Client API Facade: frontend/src/api/client.ts
Auth/Theming State: AuthContext, (Theme handling inside NavBar currently)
Backend API Surface: backend/*_routes.py + routes.py aggregator
Domain/Data Models: backend/schemas.py
Persistence / Infrastructure: backend/database.py (Mongo), docker-compose.yml
Scripts/Utilities: backend/db_utils.py, test_api.py
```

## Suggested Future Structural Enhancements

- Add explicit `services/` layer implementations (currently missing actual service classes; only placeholder directory).
- Isolate domain logic further (e.g., `repositories/` for DB access patterns).
- Create a dedicated `hooks/` folder on frontend for domain-specific data (e.g., `useProjects`, `useTasks`).

_End of structure report._
