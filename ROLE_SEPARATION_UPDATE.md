# Role Separation Update - Annotator & QA

## Overview

Added separate "annotator" and "qa" roles to the system to distinguish between users who perform initial annotations and users who perform quality assurance reviews.

## Backend Changes

### 1. Schema Updates (`backend/schemas.py`)

#### Updated User Schemas

- **UserBase**: Added "qa" to role Literal: `role: Literal["admin", "manager", "annotator", "qa"]`
- **UserCreate**: Updated role type to include "qa"
- **UserInDB**: Updated role type to include "qa"
- **UserResponse**: Updated role type to include "qa"

#### New Schema

- **QAUser**: New schema class for QA-specific responses
  ```python
  class QAUser(BaseModel):
      id: str
      name: str
      email: str
      role: Literal["qa"]
      skills: Optional[List[str]] = []
  ```

### 2. Route Updates (`backend/routes.py`)

#### New Endpoint

- **GET /qa-users**: Returns list of all users with "qa" role
  ```python
  @router.get("/qa-users", response_model=List[UserResponse])
  async def get_qa_users(current_user: UserInDB = Depends(get_current_user)):
      """List all QA users (role='qa') - admin, manager, or qa can view"""
      if current_user.role not in ["admin", "manager", "qa"]:
          raise HTTPException(status_code=403, detail="Not authorized")
      users = await database.users_collection.find({"role": "qa"}).to_list(None)
      return [as_response(UserResponse, u) for u in users]
  ```

#### Updated Registration

- Registration now initializes `skills=[]` for both "annotator" and "qa" roles
  ```python
  elif user.role in ["annotator", "qa"]:
      user_dict["skills"] = []
  ```

#### Task Assignment Validation

- **PUT /tasks/{task_id}/assign**: Added role validation
  - Validates that `annotator_id` refers to a user with role="annotator"
  - Validates that `qa_id` refers to a user with role="qa"
  - Returns clear error messages if wrong role type is used

#### Permission Updates

Updated the following routes to allow "qa" role access:

1. **GET /projects/{project_id}** (line 307-324)

   - QA users can now view projects they're invited to
   - Changed from `role == "annotator"` to `role in ["annotator", "qa"]`

2. **GET /projects/{project_id}/tasks** (line 534-550)

   - QA users can view tasks in projects they're invited to
   - Changed from `role == "annotator"` to `role in ["annotator", "qa"]`

3. **GET /tasks/{task_id}** (line 805-822)

   - QA users can view individual tasks they're invited to
   - Changed from `role == "annotator"` to `role in ["annotator", "qa"]`

4. **PUT /tasks/{task_id}/qa-submit** (line 1130-1144)

   - Changed from `role == "annotator"` to `role == "qa"`
   - Only QA role can submit QA reviews now

5. **PUT /tasks/{task_id}/annotation** (line 1000-1015)
   - Kept as annotator-only (no change needed)
   - Only annotators can submit annotations

## Frontend Changes

### 1. Register Page (`frontend/src/pages/RegisterPage.tsx`)

#### Updated Role Selection

- Added "qa" as a role option in the registration dropdown
- Updated state type: `useState<'annotator' | 'manager' | 'qa'>('annotator')`
- Dropdown now shows:
  - Annotator
  - QA Reviewer
  - Manager

### 2. Assign Task Page (`frontend/src/pages/AssignTaskPage.tsx`)

#### Separate Dropdowns for Annotators and QA

- Added `qaUsers` state to store QA user list
- Added API call to fetch QA users from `/qa-users` endpoint
- Replaced text input for QA with proper dropdown:
  ```tsx
  <select value={qaId} onChange={(e) => setQaId(e.target.value)}>
    <option value="">— Select QA Reviewer —</option>
    {qaUsers.map((q) => (
      <option key={q.id} value={q.id}>
        {q.name} ({q.email})
      </option>
    ))}
  </select>
  ```

### 3. Auth Context (`frontend/src/auth/AuthContext.tsx`)

- No changes needed - User type already has `role: string` which supports "qa"

## Database Schema Impact

### Users Collection

```json
{
  "_id": ObjectId,
  "name": "string",
  "email": "string",
  "hashed_password": "string",
  "role": "annotator" | "manager" | "qa" | "admin",
  "skills": ["skill1", "skill2"],  // For annotator and qa roles
  "created_at": "datetime"
}
```

## API Endpoints Summary

### New Endpoints

- `GET /qa-users` - List all QA reviewers

### Modified Endpoints

- `POST /auth/register` - Now accepts "qa" as a role
- `PUT /tasks/{task_id}/assign` - Now validates role types
- `GET /projects/{project_id}` - Now accessible to QA users
- `GET /projects/{project_id}/tasks` - Now accessible to QA users
- `GET /tasks/{task_id}` - Now accessible to QA users
- `PUT /tasks/{task_id}/qa-submit` - Now restricted to QA role only

## Testing Checklist

### Backend Testing

- [ ] Register a new user with role="qa"
- [ ] Verify /qa-users endpoint returns QA users only
- [ ] Try to assign an annotator as QA (should fail)
- [ ] Try to assign a QA user as annotator (should fail)
- [ ] Verify QA user can view projects they're invited to
- [ ] Verify QA user can view tasks in their projects
- [ ] Verify QA user can submit QA reviews
- [ ] Verify QA user cannot submit annotations
- [ ] Verify annotator cannot submit QA reviews

### Frontend Testing

- [ ] Register page shows "QA Reviewer" option
- [ ] Can successfully register as QA user
- [ ] Assign task page shows separate dropdowns for annotators and QA
- [ ] QA dropdown populated with QA users only
- [ ] Annotator dropdown shows annotators only
- [ ] Cannot select annotator as QA reviewer
- [ ] Cannot select QA user as annotator

## Migration Notes

### Existing Data

- No migration script needed for existing users
- Existing "annotator" users remain as is
- New "qa" role is only for newly registered users or manually updated users

### Manual User Updates (if needed)

To convert an existing annotator to QA role:

```javascript
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "qa" } });
```

## Role Permission Matrix

| Feature              | Admin | Manager  | Annotator    | QA           |
| -------------------- | ----- | -------- | ------------ | ------------ |
| Create Projects      | ❌    | ✅       | ❌           | ❌           |
| Assign Tasks         | ✅    | ✅       | ❌           | ❌           |
| View Project Details | ✅    | ✅ (own) | ✅ (invited) | ✅ (invited) |
| View Tasks           | ✅    | ✅ (own) | ✅ (invited) | ✅ (invited) |
| Submit Annotation    | ✅    | ✅       | ✅           | ❌           |
| Submit QA Review     | ✅    | ✅       | ❌           | ✅           |
| Return Tasks         | ✅    | ✅       | ❌           | ❌           |
| View Completed Tasks | ✅    | ✅ (own) | ❌           | ❌           |
| Export Data          | ✅    | ✅ (own) | ❌           | ❌           |

## Benefits of This Change

1. **Clear Role Separation**: Annotators and QA reviewers are now distinct roles with specific permissions
2. **Better Security**: QA users can't submit annotations, annotators can't submit QA reviews
3. **Improved UX**: Assignment interface clearly shows who can do what
4. **Validation**: Backend validates that the right role is assigned for each task type
5. **Scalability**: Easy to add more role-specific features in the future

## Future Enhancements

- Add bulk user role management for admins
- Add role-specific dashboards
- Add role-based notification preferences
- Track separate time metrics for annotator vs QA time
- Add role-specific performance metrics
