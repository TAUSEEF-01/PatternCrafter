# Backend Routes Structure

```
backend/
│
├── main.py                    # FastAPI app entry point
│
├── routes.py                  # Main router combiner (20 lines)
│   └── Combines all route modules with tags
│
├── utils.py                   # Shared utilities (NEW)
│   ├── get_current_user()
│   ├── as_response()
│   ├── DATA_MODEL_BY_CATEGORY
│   └── ANNOTATION_MODEL_BY_CATEGORY
│
├── auth_routes.py             # Authentication (NEW)
│   ├── POST   /auth/register
│   ├── POST   /auth/login
│   └── GET    /auth/me
│
├── user_routes.py             # User Management (NEW)
│   ├── GET    /users
│   ├── GET    /users/{user_id}
│   ├── PUT    /users/me/skills
│   └── GET    /annotators
│
├── project_routes.py          # Project Management (NEW)
│   ├── POST   /projects
│   ├── GET    /projects
│   ├── GET    /projects/{project_id}
│   ├── PUT    /projects/{project_id}/complete
│   ├── PUT    /projects/{project_id}/reopen
│   ├── DELETE /projects/{project_id}
│   ├── GET    /projects/{project_id}/invites
│   ├── GET    /projects/{project_id}/annotators
│   ├── GET    /projects/{project_id}/qa-annotators
│   ├── PUT    /projects/{project_id}/qa-annotators
│   └── GET    /projects/{project_id}/annotator-stats
│
├── task_routes.py             # Task Management (NEW)
│   ├── POST   /projects/{project_id}/tasks
│   ├── GET    /projects/{project_id}/tasks
│   ├── GET    /projects/{project_id}/completed-tasks
│   ├── GET    /projects/{project_id}/completed-tasks/export
│   ├── GET    /projects/{project_id}/my-tasks
│   ├── GET    /tasks/{task_id}
│   ├── PUT    /tasks/{task_id}/assign
│   ├── PUT    /tasks/{task_id}/annotation
│   ├── PUT    /tasks/{task_id}/qa
│   ├── PUT    /tasks/{task_id}/return
│   ├── DELETE /tasks/{task_id}
│   └── GET    /annotators/my-task-history
│
├── invite_routes.py           # Invitations (NEW)
│   ├── POST   /projects/{project_id}/invites
│   ├── GET    /invites
│   ├── PUT    /invites/{invite_id}/accept
│   └── DELETE /invites/{invite_id}
│
└── notification_routes.py     # Notifications (NEW)
    ├── GET    /notifications
    ├── GET    /notifications/unread-count
    ├── PATCH  /notifications/{notification_id}/read
    └── PATCH  /notifications/mark-all-read
```

## Before vs After

### Before

```
routes.py (2012 lines) - Everything in one file
├── Authentication endpoints
├── User endpoints
├── Project endpoints
├── Task endpoints
├── Invite endpoints
├── Notification endpoints
└── All helper functions
```

### After

```
routes.py (21 lines) - Just imports and router combination
utils.py (90 lines) - Shared utilities
auth_routes.py (76 lines)
user_routes.py (85 lines)
project_routes.py (510 lines)
task_routes.py (870 lines)
invite_routes.py (195 lines)
notification_routes.py (78 lines)
```

## Key Benefits

✅ **No Frontend Changes Required** - All URLs stay the same
✅ **Better Code Organization** - Related endpoints grouped together
✅ **Easier Maintenance** - Smaller, focused files
✅ **Better Documentation** - OpenAPI tags organize endpoints
✅ **Improved Collaboration** - Less merge conflicts
✅ **Easier Testing** - Test modules independently

## Module Dependencies

```
main.py
  └── routes.py
       ├── auth_routes.py → utils.py
       ├── user_routes.py → utils.py
       ├── project_routes.py → utils.py
       ├── task_routes.py → utils.py
       ├── invite_routes.py → utils.py
       └── notification_routes.py → utils.py
```

All route modules depend on `utils.py` for:

- Authentication (`get_current_user`)
- Response formatting (`as_response`)
- Validation models (`DATA_MODEL_BY_CATEGORY`, `ANNOTATION_MODEL_BY_CATEGORY`)
