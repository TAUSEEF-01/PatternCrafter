# Backend Routes Restructuring

## Overview

The backend routes have been reorganized from a single monolithic `routes.py` file into multiple focused route modules for better maintainability and organization.

## New Structure

### Files Created:

1. **`utils.py`** - Shared utilities and helpers

   - `get_current_user()` - Authentication dependency
   - `as_response()` - ObjectId to string conversion
   - `DATA_MODEL_BY_CATEGORY` - Task data validation models
   - `ANNOTATION_MODEL_BY_CATEGORY` - Annotation validation models
   - Helper functions for ObjectId stringification

2. **`auth_routes.py`** - Authentication endpoints

   - `POST /auth/register` - User registration
   - `POST /auth/login` - User login
   - `GET /auth/me` - Get current user info

3. **`user_routes.py`** - User management endpoints

   - `GET /users` - List all users (admin only)
   - `GET /users/{user_id}` - Get user by ID
   - `PUT /users/me/skills` - Update annotator skills
   - `GET /annotators` - List all annotators

4. **`project_routes.py`** - Project management endpoints

   - `POST /projects` - Create project
   - `GET /projects` - List projects
   - `GET /projects/{project_id}` - Get project details
   - `PUT /projects/{project_id}/complete` - Mark project complete
   - `PUT /projects/{project_id}/reopen` - Reopen project
   - `DELETE /projects/{project_id}` - Delete project
   - `GET /projects/{project_id}/invites` - List project invites
   - `GET /projects/{project_id}/annotators` - List project annotators
   - `GET /projects/{project_id}/qa-annotators` - List QA annotators
   - `PUT /projects/{project_id}/qa-annotators` - Update QA annotators
   - `GET /projects/{project_id}/annotator-stats` - Get annotator statistics

5. **`task_routes.py`** - Task management endpoints

   - `POST /projects/{project_id}/tasks` - Create task
   - `GET /projects/{project_id}/tasks` - List project tasks
   - `GET /projects/{project_id}/completed-tasks` - List completed tasks
   - `GET /projects/{project_id}/completed-tasks/export` - Export completed tasks (CSV/JSON)
   - `GET /projects/{project_id}/my-tasks` - Get annotator's assigned tasks
   - `GET /tasks/{task_id}` - Get task details
   - `PUT /tasks/{task_id}/assign` - Assign task to annotator/QA
   - `PUT /tasks/{task_id}/annotation` - Submit annotation
   - `PUT /tasks/{task_id}/qa` - Submit QA review
   - `PUT /tasks/{task_id}/return` - Return task to annotator
   - `DELETE /tasks/{task_id}` - Delete task
   - `GET /annotators/my-task-history` - Get annotator task history

6. **`invite_routes.py`** - Invitation management endpoints

   - `POST /projects/{project_id}/invites` - Create invite
   - `GET /invites` - List user invites
   - `PUT /invites/{invite_id}/accept` - Accept invite
   - `DELETE /invites/{invite_id}` - Cancel/delete invite

7. **`notification_routes.py`** - Notification endpoints

   - `GET /notifications` - List notifications
   - `GET /notifications/unread-count` - Get unread count
   - `PATCH /notifications/{notification_id}/read` - Mark notification as read
   - `PATCH /notifications/mark-all-read` - Mark all notifications as read

8. **`routes.py`** - Main router (simplified)
   - Imports all route modules
   - Combines them into a single router with tags
   - Maintains backward compatibility

## Benefits

### 1. **Better Organization**

- Related endpoints are grouped together
- Easier to locate specific functionality
- Clear separation of concerns

### 2. **Improved Maintainability**

- Smaller, focused files are easier to understand and modify
- Reduced file size makes navigation faster
- Changes to one area don't affect others

### 3. **Better Collaboration**

- Multiple developers can work on different route files simultaneously
- Reduced merge conflicts
- Clear ownership of different areas

### 4. **Backward Compatibility**

- All URL endpoints remain exactly the same
- No changes required in the frontend
- Existing API consumers are unaffected

### 5. **Better Testing**

- Each module can be tested independently
- Easier to mock dependencies
- More focused test files

## Frontend Impact

**NONE** - All endpoint URLs and request/response structures remain identical. The frontend code does not need any changes.

## Migration Notes

- The original 2000+ line `routes.py` file has been replaced with a simple router combiner
- All business logic has been moved to specialized route modules
- Shared utilities have been extracted to `utils.py`
- All dependencies and imports have been updated accordingly

## Usage

The API continues to work exactly as before. The restructuring is purely internal and transparent to API consumers.

```python
# Example: Import and use in main.py
from routes import router

app.include_router(router)
```

## Tags in OpenAPI Documentation

The API endpoints are now organized with tags for better documentation:

- **Authentication** - Auth endpoints
- **Users** - User management
- **Projects** - Project CRUD operations
- **Tasks** - Task management and workflows
- **Invites** - Invitation system
- **Notifications** - Notification system

This makes the auto-generated API documentation (Swagger/OpenAPI) much more organized and easier to navigate.
