from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime

import database
from schemas import *
from auth import get_password_hash, verify_password, create_access_token, verify_token
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get current authenticated user"""
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await database.users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return UserInDB(**user)


# Helpers for category-specific validation
DATA_MODEL_BY_CATEGORY = {
    TaskCategory.LLM_RESPONSE_GRADING: LLMResponseGradingData,
    TaskCategory.CHATBOT_MODEL_ASSESSMENT: ChatbotModelAssessmentData,
    TaskCategory.RESPONSE_SELECTION: ResponseSelectionData,
    TaskCategory.IMAGE_CLASSIFICATION: ImageClassificationData,
    TaskCategory.TEXT_CLASSIFICATION: TextClassificationData,
    TaskCategory.OBJECT_DETECTION: ObjectDetectionData,
    TaskCategory.NER: NERData,
}

ANNOTATION_MODEL_BY_CATEGORY = {
    TaskCategory.LLM_RESPONSE_GRADING: LLMResponseGradingAnnotation,
    TaskCategory.CHATBOT_MODEL_ASSESSMENT: ChatbotModelAssessmentAnnotation,
    TaskCategory.RESPONSE_SELECTION: ResponseSelectionAnnotation,
    TaskCategory.IMAGE_CLASSIFICATION: ImageClassificationAnnotation,
    TaskCategory.TEXT_CLASSIFICATION: TextClassificationAnnotation,
    TaskCategory.OBJECT_DETECTION: ObjectDetectionAnnotation,
    TaskCategory.NER: NERAnnotation,
}


# Generic helpers to convert Mongo docs with ObjectIds into response-friendly dicts
def _stringify_object_ids(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_stringify_object_ids(v) for v in value]
    if isinstance(value, dict):
        return {k: _stringify_object_ids(v) for k, v in value.items()}
    return value


def as_response(model_cls, doc: Dict[str, Any]):
    """Return an instance of model_cls with all ObjectIds converted to strings and aliases preserved."""
    data = _stringify_object_ids(doc)
    return model_cls(**data)


class UpdateSkillsRequest(BaseModel):
    skills: List[str]


@router.put(
    "/users/me/skills", response_model=UserResponse, response_model_by_alias=False
)
async def update_my_skills(
    payload: UpdateSkillsRequest, current_user: UserInDB = Depends(get_current_user)
):
    """Annotator updates their skills list."""
    if current_user.role != "annotator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only annotators can update skills",
        )
    await database.users_collection.update_one(
        {"_id": current_user.id}, {"$set": {"skills": payload.skills}}
    )
    updated = await database.users_collection.find_one({"_id": current_user.id})
    return as_response(UserResponse, updated)


# List annotators (manager/admin only)
@router.get(
    "/annotators", response_model=List[UserResponse], response_model_by_alias=False
)
async def list_annotators(current_user: UserInDB = Depends(get_current_user)):
    """List all annotators with their skills (accessible to managers and admins)."""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list annotators",
        )

    annotators = await database.users_collection.find({"role": "annotator"}).to_list(
        None
    )
    return [as_response(UserResponse, u) for u in annotators]


# Authentication endpoints
@router.post(
    "/auth/register", response_model=UserResponse, response_model_by_alias=False
)
async def register_user(user: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await database.users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Hash password
    hashed_password = get_password_hash(user.password)

    # Create user document
    user_dict = user.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    user_dict["created_at"] = datetime.utcnow()

    # Add role-specific fields
    if user.role == "manager":
        user_dict["paid"] = False
    elif user.role == "annotator":
        user_dict["skills"] = []

    # Insert user
    result = await database.users_collection.insert_one(user_dict)

    # Get created user
    created_user = await database.users_collection.find_one({"_id": result.inserted_id})
    return as_response(UserResponse, created_user)


@router.post("/auth/login", response_model=Token)
async def login(login_request: LoginRequest):
    """Login user and return access token"""
    user = await database.users_collection.find_one({"email": login_request.email})
    if not user or not verify_password(login_request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse, response_model_by_alias=False)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information"""
    # Use by_alias to provide `_id` and coerce ObjectId to string for response model
    data = current_user.model_dump(by_alias=True)
    _id = data.get("_id", current_user.id)
    if isinstance(_id, ObjectId):
        data["_id"] = str(_id)
    else:
        data["_id"] = str(current_user.id)
    return UserResponse(**data)


# User endpoints
@router.get("/users", response_model=List[UserResponse], response_model_by_alias=False)
async def get_users(
    role: Optional[str] = None, current_user: UserInDB = Depends(get_current_user)
):
    """Get all users (admin only) or filtered by role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    query = {}
    if role:
        query["role"] = role

    users = await database.users_collection.find(query).to_list(None)
    return [as_response(UserResponse, user) for user in users]


@router.get(
    "/users/{user_id}", response_model=UserResponse, response_model_by_alias=False
)
async def get_user(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Get user by ID"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
        )

    user = await database.users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return as_response(UserResponse, user)


# Project endpoints
@router.post("/projects", response_model=ProjectResponse, response_model_by_alias=False)
async def create_project(
    project: ProjectCreate, current_user: UserInDB = Depends(get_current_user)
):
    """Create a new project (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can create projects",
        )

    project_dict = {
        "manager_id": current_user.id,
        "details": project.details,
        "category": project.category,
        "task_ids": [],
        "created_at": datetime.utcnow(),
    }

    result = await database.projects_collection.insert_one(project_dict)
    created_project = await database.projects_collection.find_one(
        {"_id": result.inserted_id}
    )

    return as_response(ProjectResponse, created_project)


@router.get(
    "/projects", response_model=List[ProjectResponse], response_model_by_alias=False
)
async def get_projects(current_user: UserInDB = Depends(get_current_user)):
    """Get projects based on user role"""
    if current_user.role == "manager":
        # Managers see their own projects
        projects = await database.projects_collection.find(
            {"manager_id": current_user.id}
        ).to_list(None)
    elif current_user.role == "admin":
        # Admins see all projects
        projects = await database.projects_collection.find().to_list(None)
    else:
        # Annotators see all available projects (names/details/category, list only)
        projects = await database.projects_collection.find().to_list(None)

    return [as_response(ProjectResponse, project) for project in projects]


@router.get(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    response_model_by_alias=False,
)
async def get_project(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Get project by ID"""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Check permissions
    if current_user.role == "manager" and project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project",
        )
    elif current_user.role == "annotator":
        # Check if annotator/qa is invited to this project
        invite = await database.invites_collection.find_one(
            {
                "project_id": ObjectId(project_id),
                "user_id": current_user.id,
                "accepted_status": True,
            }
        )
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this project",
            )

    return as_response(ProjectResponse, project)


@router.put(
    "/projects/{project_id}/complete",
    response_model=ProjectResponse,
    response_model_by_alias=False,
)
async def mark_project_complete(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Mark project as completed (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can mark projects as complete",
        )

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project",
        )

    # Check if all tasks are completed
    tasks = await database.tasks_collection.find(
        {"project_id": ObjectId(project_id)}
    ).to_list(None)

    if len(tasks) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark project as complete. Project has no tasks.",
        )

    incomplete_tasks = [
        t
        for t in tasks
        if not t.get("completed_status", {}).get("annotator_part", False)
    ]

    if incomplete_tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark project as complete. {len(incomplete_tasks)} task(s) are still incomplete.",
        )

    # Mark project as completed
    await database.projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$set": {"is_completed": True}}
    )

    updated_project = await database.projects_collection.find_one(
        {"_id": ObjectId(project_id)}
    )
    return as_response(ProjectResponse, updated_project)


@router.put(
    "/projects/{project_id}/reopen",
    response_model=ProjectResponse,
    response_model_by_alias=False,
)
async def reopen_project(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Reopen a completed project (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can reopen projects",
        )

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project",
        )

    # Reopen project
    await database.projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$set": {"is_completed": False}}
    )

    updated_project = await database.projects_collection.find_one(
        {"_id": ObjectId(project_id)}
    )
    return as_response(ProjectResponse, updated_project)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Delete a project (manager only, only if project has no tasks)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can delete projects",
        )

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project",
        )

    # Check if project has any tasks
    tasks_count = await database.tasks_collection.count_documents(
        {"project_id": ObjectId(project_id)}
    )

    if tasks_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete project with existing tasks. Please complete or remove all tasks first.",
        )

    # Delete related data
    await database.invites_collection.delete_many({"project_id": ObjectId(project_id)})
    await database.project_working_collection.delete_many(
        {"project_id": ObjectId(project_id)}
    )
    await database.annotator_tasks_collection.delete_many(
        {"project_id": ObjectId(project_id)}
    )

    # Delete the project
    await database.projects_collection.delete_one({"_id": ObjectId(project_id)})

    return {"message": "Project deleted successfully"}


# Project invites listing for managers/admins
@router.get(
    "/projects/{project_id}/invites",
    response_model=List[InviteResponse],
    response_model_by_alias=False,
)
async def list_project_invites(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """List all invites for a project (only admin or the project's manager)."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view invites for this project",
        )

    invites = await database.invites_collection.find(
        {"project_id": ObjectId(project_id)}
    ).to_list(None)
    return [as_response(InviteResponse, inv) for inv in invites]


# List annotators who are working on this project
@router.get(
    "/projects/{project_id}/annotators",
    response_model=List[UserResponse],
    response_model_by_alias=False,
)
async def list_project_annotators(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """List annotators who have accepted invites (present in project_working)."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list annotators for this project",
        )

    pw = await database.project_working_collection.find_one(
        {"project_id": ObjectId(project_id)}
    )
    annotator_ids = [
        a.get("annotator_id")
        for a in (pw.get("annotator_assignments", []) if pw else [])
        if a.get("annotator_id") is not None
    ]
    if not annotator_ids:
        return []

    users = await database.users_collection.find(
        {"_id": {"$in": annotator_ids}}
    ).to_list(None)
    return [as_response(UserResponse, u) for u in users]


# QA Annotators management for projects
@router.get(
    "/projects/{project_id}/qa-annotators",
    response_model=List[UserResponse],
    response_model_by_alias=False,
)
async def list_project_qa_annotators(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """List annotators designated as QA reviewers for this project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list QA annotators for this project",
        )

    pw = await database.project_working_collection.find_one(
        {"project_id": ObjectId(project_id)}
    )
    qa_annotator_ids = pw.get("qa_annotator_ids", []) if pw else []

    if not qa_annotator_ids:
        return []

    users = await database.users_collection.find(
        {"_id": {"$in": qa_annotator_ids}}
    ).to_list(None)
    return [as_response(UserResponse, u) for u in users]


@router.put("/projects/{project_id}/qa-annotators")
async def update_project_qa_annotators(
    project_id: str,
    annotator_ids: List[str],
    current_user: UserInDB = Depends(get_current_user),
):
    """Set which annotators are designated as QA reviewers for this project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage QA annotators for this project",
        )

    # Validate all annotator IDs
    valid_ids = []
    for aid in annotator_ids:
        if not ObjectId.is_valid(aid):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid annotator ID: {aid}",
            )
        valid_ids.append(ObjectId(aid))

    # Verify all are actual annotators in the project
    pw = await database.project_working_collection.find_one(
        {"project_id": ObjectId(project_id)}
    )
    if not pw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project working record not found",
        )

    project_annotator_ids = [
        a.get("annotator_id")
        for a in pw.get("annotator_assignments", [])
        if a.get("annotator_id") is not None
    ]

    for vid in valid_ids:
        if vid not in project_annotator_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Annotator {str(vid)} is not part of this project",
            )

    # Update the qa_annotator_ids field
    await database.project_working_collection.update_one(
        {"project_id": ObjectId(project_id)},
        {"$set": {"qa_annotator_ids": valid_ids}},
    )

    return {"message": "QA annotators updated successfully"}


# Task endpoints
@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskResponse,
    response_model_by_alias=False,
)
async def create_task(
    project_id: str,
    task: TaskCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    """Create a new task for a project"""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    # Check if project exists and user has permission
    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role == "manager" and project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create tasks for this project",
        )
    elif current_user.role != "manager" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can create tasks",
        )

    # Enforce task category matches project category (compare enum value vs stored string)
    project_cat = project.get("category")
    incoming_cat_value = (
        task.category.value
        if isinstance(task.category, TaskCategory)
        else str(task.category)
    )
    if str(project_cat) != str(incoming_cat_value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task category must match project's category",
        )

    # Validate task_data based on category
    # Resolve the proper enum for validation lookup
    try:
        cat_enum = (
            task.category
            if isinstance(task.category, TaskCategory)
            else TaskCategory(str(task.category))
        )
    except Exception:
        cat_enum = None

    model = DATA_MODEL_BY_CATEGORY.get(cat_enum) if cat_enum else None
    task_data: Dict[str, Any]
    if model is not None:
        try:
            task_data = model(**task.task_data).model_dump()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid task_data for category {task.category}: {e}",
            )
    else:
        # Fallback for custom categories
        task_data = task.task_data

    task_dict = {
        "project_id": ObjectId(project_id),
        "category": incoming_cat_value,
        "task_data": task_data,
        "annotation": None,
        "qa_annotation": None,
        "qa_feedback": None,
        "completed_status": {"annotator_part": False, "qa_part": False},
        "tag_task": task.tag_task,
        "assigned_annotator_id": None,
        "assigned_qa_id": None,
        "created_at": datetime.utcnow(),
        "annotator_started_at": None,
        "annotator_completed_at": None,
        "qa_started_at": None,
        "qa_completed_at": None,
    }

    result = await database.tasks_collection.insert_one(task_dict)

    # Update project with new task ID
    await database.projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$push": {"task_ids": result.inserted_id}}
    )

    created_task = await database.tasks_collection.find_one({"_id": result.inserted_id})
    return as_response(TaskResponse, created_task)


@router.get(
    "/projects/{project_id}/tasks",
    response_model=List[TaskResponse],
    response_model_by_alias=False,
)
async def get_project_tasks(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Get all tasks for a project"""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    # Check if project exists and user has permission
    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Permission check (similar to get_project)
    if current_user.role == "manager" and project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view tasks for this project",
        )
    elif current_user.role == "annotator":
        invite = await database.invites_collection.find_one(
            {
                "project_id": ObjectId(project_id),
                "user_id": current_user.id,
                "accepted_status": True,
            }
        )
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view tasks for this project",
            )

    tasks = await database.tasks_collection.find(
        {"project_id": ObjectId(project_id)}
    ).to_list(None)
    return [as_response(TaskResponse, task) for task in tasks]


@router.get(
    "/projects/{project_id}/completed-tasks",
    response_model=List[TaskResponse],
    response_model_by_alias=False,
)
async def get_completed_tasks(
    project_id: str,
    annotator_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user),
):
    """List tasks in a project that have been completed by the annotator (annotator_part=True).

    Accessible by admin or the project's manager. Optional filter by annotator_id.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view completed tasks for this project",
        )

    # Fully completed = both annotator and QA parts done
    query: Dict[str, Any] = {
        "project_id": ObjectId(project_id),
        "completed_status.annotator_part": True,
        "completed_status.qa_part": True,
    }
    if annotator_id:
        if not ObjectId.is_valid(annotator_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid annotator_id"
            )
        query["assigned_annotator_id"] = ObjectId(annotator_id)

    tasks = await database.tasks_collection.find(query).to_list(None)
    return [as_response(TaskResponse, task) for task in tasks]


@router.get("/projects/{project_id}/completed-tasks/export")
async def export_completed_tasks(
    project_id: str,
    format: str = "csv",
    current_user: UserInDB = Depends(get_current_user),
):
    """Export fully completed tasks (annotator+QA) as CSV or JSON.

    Accessible by admin or the project's manager.
    """
    import io, csv, json

    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    cursor = database.tasks_collection.find(
        {
            "project_id": ObjectId(project_id),
            "completed_status.annotator_part": True,
            "completed_status.qa_part": True,
        }
    )
    docs = await cursor.to_list(None)

    # Prepare export rows
    rows = []
    for d in docs:
        rows.append(
            {
                "task_id": str(d.get("_id")),
                "project_id": str(d.get("project_id")),
                "category": str(d.get("category")),
                "annotator_id": (
                    str(d.get("assigned_annotator_id"))
                    if d.get("assigned_annotator_id")
                    else None
                ),
                "qa_id": (
                    str(d.get("assigned_qa_id")) if d.get("assigned_qa_id") else None
                ),
                "created_at": (
                    d.get("created_at").isoformat() if d.get("created_at") else None
                ),
                "annotator_started_at": (
                    d.get("annotator_started_at").isoformat()
                    if d.get("annotator_started_at")
                    else None
                ),
                "annotator_completed_at": (
                    d.get("annotator_completed_at").isoformat()
                    if d.get("annotator_completed_at")
                    else None
                ),
                "qa_started_at": (
                    d.get("qa_started_at").isoformat()
                    if d.get("qa_started_at")
                    else None
                ),
                "qa_completed_at": (
                    d.get("qa_completed_at").isoformat()
                    if d.get("qa_completed_at")
                    else None
                ),
                "task_data": json.dumps(d.get("task_data", {}), ensure_ascii=False),
                "annotation": json.dumps(d.get("annotation", {}), ensure_ascii=False),
                "qa_annotation": json.dumps(
                    d.get("qa_annotation", {}), ensure_ascii=False
                ),
                "qa_feedback": d.get("qa_feedback"),
            }
        )

    if format.lower() == "json":
        return JSONResponse(rows)

    # Default CSV
    output = io.StringIO()
    fieldnames = (
        list(rows[0].keys())
        if rows
        else [
            "task_id",
            "project_id",
            "category",
            "annotator_id",
            "qa_id",
            "created_at",
            "annotator_started_at",
            "annotator_completed_at",
            "qa_started_at",
            "qa_completed_at",
            "task_data",
            "annotation",
            "qa_annotation",
            "qa_feedback",
        ]
    )
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow(r)
    output.seek(0)
    headers = {
        "Content-Disposition": f"attachment; filename=completed_tasks_{project_id}.csv"
    }
    return StreamingResponse(
        iter([output.read()]), media_type="text/csv", headers=headers
    )


@router.get(
    "/projects/{project_id}/my-tasks",
    response_model=List[TaskResponse],
    response_model_by_alias=False,
)
async def get_my_project_tasks(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Get tasks in a project that are assigned to the current annotator.

    Only available to annotators who have accepted an invite (or been added to project_working).
    """
    if current_user.role != "annotator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only annotators can view their assigned tasks",
        )

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    # Ensure project exists
    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Check annotator is a member (accepted invite or present in project_working)
    invite = await database.invites_collection.find_one(
        {
            "project_id": ObjectId(project_id),
            "user_id": current_user.id,
            "accepted_status": True,
        }
    )
    if not invite:
        pw = await database.project_working_collection.find_one(
            {
                "project_id": ObjectId(project_id),
                "$or": [
                    {"annotator_assignments.annotator_id": current_user.id},
                    {"qa_annotator_ids": current_user.id},
                ],
            }
        )
        if not pw:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view tasks for this project",
            )

    # Get all tasks assigned to this annotator (as annotator or as QA reviewer)
    # Don't filter by completion status - let the frontend decide what to show
    tasks = await database.tasks_collection.find(
        {
            "project_id": ObjectId(project_id),
            "$or": [
                {"assigned_annotator_id": current_user.id},
                {"assigned_qa_id": current_user.id},
            ],
        }
    ).to_list(None)
    return [as_response(TaskResponse, task) for task in tasks]


@router.get(
    "/tasks/{task_id}", response_model=TaskResponse, response_model_by_alias=False
)
async def get_task(task_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Get single task by ID if user has access"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )
    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    # Permission: must be admin, project manager, or invited annotator
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    if current_user.role == "admin":
        return as_response(TaskResponse, task)
    if (
        current_user.role == "manager"
        and project
        and project["manager_id"] == current_user.id
    ):
        return as_response(TaskResponse, task)
    if current_user.role == "annotator":
        invite = await database.invites_collection.find_one(
            {
                "project_id": task["project_id"],
                "user_id": current_user.id,
                "accepted_status": True,
            }
        )
        if invite:
            return as_response(TaskResponse, task)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


# Task assignment endpoint
@router.put("/tasks/{task_id}/assign")
async def assign_task(
    task_id: str,
    payload: AssignTaskRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """Assign annotator and/or QA to a task (manager or admin)"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Only admins or the project's manager can assign
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager"
        and project
        and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to assign this task",
        )

    update: Dict[str, Any] = {}
    if payload.annotator_id:
        if not ObjectId.is_valid(payload.annotator_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid annotator_id",
            )

        # Validate that the user has annotator role
        annotator_user = await database.users_collection.find_one(
            {"_id": ObjectId(payload.annotator_id)}
        )
        if not annotator_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Annotator user not found",
            )
        if annotator_user.get("role") != "annotator":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must have annotator role to be assigned as annotator",
            )

        # Validate that annotator belongs to project_working for this project
        pw = await database.project_working_collection.find_one(
            {"project_id": task["project_id"]}
        )
        allowed_annotators = set(
            a.get("annotator_id")
            for a in (pw.get("annotator_assignments", []) if pw else [])
        )
        if ObjectId(payload.annotator_id) not in allowed_annotators:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Annotator is not part of this project (invite not accepted)",
            )
        update["assigned_annotator_id"] = ObjectId(payload.annotator_id)
        # Set annotator_started_at if not present
        if not task.get("annotator_started_at"):
            update["annotator_started_at"] = datetime.utcnow()

    if payload.qa_id:
        if not ObjectId.is_valid(payload.qa_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid qa_id"
            )

        # Validate that the user is an annotator designated as QA for this project
        qa_user = await database.users_collection.find_one(
            {"_id": ObjectId(payload.qa_id)}
        )
        if not qa_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QA user not found",
            )
        if qa_user.get("role") != "annotator":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only annotators can be assigned as QA reviewers",
            )

        # Check if this annotator is designated as QA for this project
        pw = await database.project_working_collection.find_one(
            {"project_id": task["project_id"]}
        )
        if not pw or ObjectId(payload.qa_id) not in pw.get("qa_annotator_ids", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This annotator is not designated as QA reviewer for this project",
            )

        update["assigned_qa_id"] = ObjectId(payload.qa_id)
        if not task.get("qa_started_at"):
            update["qa_started_at"] = datetime.utcnow()

    if not update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No assignment provided"
        )

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)}, {"$set": update}
    )
    # If annotator was assigned, update project_working to include this task under that annotator
    if payload.annotator_id:
        await database.project_working_collection.update_one(
            {
                "project_id": task["project_id"],
                "annotator_assignments.annotator_id": ObjectId(payload.annotator_id),
            },
            {
                "$addToSet": {"annotator_assignments.$.task_ids": ObjectId(task_id)},
            },
        )

        # Create entry in annotator_tasks_collection for time tracking
        # Only store completion_time, timer runs on frontend
        annotator_task_entry = {
            "annotator_id": ObjectId(payload.annotator_id),
            "project_id": task["project_id"],
            "task_id": ObjectId(task_id),
            "completion_time": None,  # Will be set when annotation is submitted
        }

        # Check if entry already exists for this task
        existing_entry = await database.annotator_tasks_collection.find_one(
            {
                "task_id": ObjectId(task_id),
                "annotator_id": ObjectId(payload.annotator_id),
            }
        )

        if not existing_entry:
            await database.annotator_tasks_collection.insert_one(annotator_task_entry)
        else:
            # Reset completion_time if reassigning
            await database.annotator_tasks_collection.update_one(
                {
                    "task_id": ObjectId(task_id),
                    "annotator_id": ObjectId(payload.annotator_id),
                },
                {
                    "$set": {
                        "completion_time": None,
                    }
                },
            )

    return {"message": "Task assignment updated"}


# Submit annotator annotation
@router.put("/tasks/{task_id}/annotation")
async def submit_annotation(
    task_id: str,
    payload: SubmitAnnotationRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """Submit annotator annotation for a task (assigned annotator only)"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Permission: only assigned annotator or admin/manager
    allowed = False
    if current_user.role in ["admin"]:
        allowed = True
    elif current_user.role == "manager":
        project = await database.projects_collection.find_one(
            {"_id": task["project_id"]}
        )
        allowed = project and project["manager_id"] == current_user.id
    elif current_user.role == "annotator":
        allowed = task.get("assigned_annotator_id") == current_user.id

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit annotation for this task",
        )

    # Validate annotation according to task category
    category = (
        TaskCategory(task["category"])
        if not isinstance(task["category"], TaskCategory)
        else task["category"]
    )
    ann_model = ANNOTATION_MODEL_BY_CATEGORY.get(category)
    annotation_dict: Dict[str, Any] = payload.annotation
    # Be tolerant: attempt coercions/mapping for common lightweight payloads
    if ann_model is not None:
        # Heuristics for LLM grading: accept {label:"good"} or {score: 4}
        if category == TaskCategory.LLM_RESPONSE_GRADING:
            if "rating" not in annotation_dict:
                # Map common fields to rating
                if "score" in annotation_dict and isinstance(
                    annotation_dict["score"], (int, float, str)
                ):
                    try:
                        annotation_dict["rating"] = int(annotation_dict["score"])
                    except Exception:
                        pass
                if "value" in annotation_dict and "rating" not in annotation_dict:
                    try:
                        annotation_dict["rating"] = int(annotation_dict["value"])
                    except Exception:
                        pass
                if "label" in annotation_dict and "rating" not in annotation_dict:
                    label = str(annotation_dict["label"]).strip().lower()
                    mapping = {
                        "excellent": 5,
                        "great": 5,
                        "good": 4,
                        "average": 3,
                        "ok": 3,
                        "poor": 2,
                        "bad": 1,
                    }
                    if label.isdigit():
                        annotation_dict["rating"] = int(label)
                    elif label in mapping:
                        annotation_dict["rating"] = mapping[label]

        # Now validate; if still invalid, fallback to storing raw annotation
        try:
            annotation_dict = ann_model(**annotation_dict).model_dump()
        except Exception:
            # Store as-is without strict validation to avoid blocking annotators
            annotation_dict = payload.annotation

    completed_at = datetime.utcnow()
    updates = {
        "annotation": annotation_dict,
        "completed_status.annotator_part": True,
        "annotator_completed_at": completed_at,
        "is_returned": False,  # Clear returned status when resubmitted
    }

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)}, {"$set": updates}
    )

    # After submission: remove this task from project_working assigned task list for the annotator
    if task.get("assigned_annotator_id"):
        await database.project_working_collection.update_one(
            {
                "project_id": task["project_id"],
                "annotator_assignments.annotator_id": task["assigned_annotator_id"],
            },
            {"$pull": {"annotator_assignments.$.task_ids": ObjectId(task_id)}},
        )

        # Update annotator_tasks_collection with completion time from frontend timer
        # If task was returned, add the new completion time to accumulated time
        completion_time = payload.completion_time if payload.completion_time else 0
        accumulated_time = task.get("accumulated_time", 0) or 0
        total_time = accumulated_time + completion_time

        await database.annotator_tasks_collection.update_one(
            {
                "task_id": ObjectId(task_id),
                "annotator_id": task["assigned_annotator_id"],
            },
            {
                "$set": {
                    "completion_time": total_time,  # Store total accumulated time
                }
            },
        )

    return {"message": "Annotation submitted"}


# Submit QA review
@router.put("/tasks/{task_id}/qa")
async def submit_qa(
    task_id: str,
    payload: SubmitQARequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """Submit QA annotation for a task (assigned QA, manager, or admin)"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Permission check
    allowed = False
    if current_user.role in ["admin"]:
        allowed = True
    elif current_user.role == "manager":
        project = await database.projects_collection.find_one(
            {"_id": task["project_id"]}
        )
        allowed = project and project["manager_id"] == current_user.id
    elif current_user.role == "annotator":
        # Check if this annotator is assigned as QA for this task
        allowed = task.get("assigned_qa_id") == current_user.id

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit QA for this task",
        )

    updates = {
        "qa_annotation": payload.qa_annotation,
        "qa_feedback": payload.qa_feedback,
        "completed_status.qa_part": True,
        "qa_completed_at": datetime.utcnow(),
    }

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)}, {"$set": updates}
    )
    return {"message": "QA submitted"}


# Return task to annotator
@router.put("/tasks/{task_id}/return")
async def return_task_to_annotator(
    task_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """Return a completed task back to the annotator for revision (manager or admin only)"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Only admins or the project's manager can return tasks
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager"
        and project
        and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to return this task",
        )

    # Task must be completed by annotator to be returnable
    if not task.get("completed_status", {}).get("annotator_part"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task must be completed by annotator before it can be returned",
        )

    # Get the completion time from annotator_tasks_collection
    annotator_task = await database.annotator_tasks_collection.find_one(
        {
            "task_id": ObjectId(task_id),
            "annotator_id": task.get("assigned_annotator_id"),
        }
    )

    current_completion_time = (
        annotator_task.get("completion_time", 0) if annotator_task else 0
    )

    # Calculate accumulated time (add previous accumulated time if task was already returned before)
    previous_accumulated_time = task.get("accumulated_time", 0) or 0
    new_accumulated_time = previous_accumulated_time + current_completion_time

    updates = {
        "completed_status.annotator_part": False,
        "is_returned": True,
        "accumulated_time": new_accumulated_time,
        "annotator_completed_at": None,
        # Keep the annotation field so annotator can see and modify their previous work
    }

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)}, {"$set": updates}
    )

    # Add task back to project_working for the annotator
    if task.get("assigned_annotator_id"):
        await database.project_working_collection.update_one(
            {
                "project_id": task["project_id"],
                "annotator_assignments.annotator_id": task["assigned_annotator_id"],
            },
            {
                "$addToSet": {"annotator_assignments.$.task_ids": ObjectId(task_id)},
            },
        )

        # Reset completion time in annotator_tasks_collection (will accumulate on next submission)
        await database.annotator_tasks_collection.update_one(
            {
                "task_id": ObjectId(task_id),
                "annotator_id": task["assigned_annotator_id"],
            },
            {
                "$set": {
                    "completion_time": None,
                }
            },
        )

    return {"message": "Task returned to annotator"}


# Delete task
@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Delete a task (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can delete tasks",
        )

    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Verify the manager owns the project
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    if not project or project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task",
        )

    # Remove task from project_working assignments
    await database.project_working_collection.update_many(
        {"project_id": task["project_id"]},
        {"$pull": {"annotator_assignments.$[].task_ids": ObjectId(task_id)}},
    )

    # Delete related annotator_tasks records
    await database.annotator_tasks_collection.delete_many(
        {"task_id": ObjectId(task_id)}
    )

    # Delete the task
    await database.tasks_collection.delete_one({"_id": ObjectId(task_id)})

    return {"message": "Task deleted successfully"}


# Invite endpoints
@router.post(
    "/projects/{project_id}/invites",
    response_model=InviteResponse,
    response_model_by_alias=False,
)
async def create_invite(
    project_id: str,
    invite: InviteCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    """Create an invite for a project"""
    if not ObjectId.is_valid(project_id) or not ObjectId.is_valid(invite.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID or user ID",
        )

    # Check if project exists and user is the manager
    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if current_user.role != "manager" or project["manager_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project managers can create invites",
        )

    # Check if user exists
    user = await database.users_collection.find_one({"_id": ObjectId(invite.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check if invite already exists
    existing_invite = await database.invites_collection.find_one(
        {"project_id": ObjectId(project_id), "user_id": ObjectId(invite.user_id)}
    )
    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite already exists for this user",
        )

    invite_dict = {
        "project_id": ObjectId(project_id),
        "user_id": ObjectId(invite.user_id),
        "accepted_status": False,
        "invited_at": datetime.utcnow(),
        "accepted_at": None,
    }

    result = await database.invites_collection.insert_one(invite_dict)
    created_invite = await database.invites_collection.find_one(
        {"_id": result.inserted_id}
    )

    return as_response(InviteResponse, created_invite)


@router.get(
    "/invites", response_model=List[InviteResponse], response_model_by_alias=False
)
async def get_user_invites(current_user: UserInDB = Depends(get_current_user)):
    """Get invites for current user"""
    invites = await database.invites_collection.find(
        {"user_id": current_user.id}
    ).to_list(None)
    return [as_response(InviteResponse, invite) for invite in invites]


@router.put("/invites/{invite_id}/accept")
async def accept_invite(
    invite_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Accept an invite"""
    if not ObjectId.is_valid(invite_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite ID"
        )

    invite = await database.invites_collection.find_one({"_id": ObjectId(invite_id)})
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )

    if invite["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to accept this invite",
        )

    if invite["accepted_status"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already accepted"
        )

    await database.invites_collection.update_one(
        {"_id": ObjectId(invite_id)},
        {"$set": {"accepted_status": True, "accepted_at": datetime.utcnow()}},
    )

    # Ensure annotator is added to project_working for this project
    project_id = invite["project_id"]
    # Find existing project_working doc
    pw = await database.project_working_collection.find_one({"project_id": project_id})

    annotator_entry = {
        "annotator_id": current_user.id,
        "task_ids": [],
        "assigned_at": datetime.utcnow(),
    }

    if pw is None:
        # Create new project_working document for this project
        await database.project_working_collection.insert_one(
            {
                "project_id": project_id,
                "annotator_assignments": [annotator_entry],
                "created_at": datetime.utcnow(),
            }
        )
    else:
        # Add annotator if not already present
        existing = pw.get("annotator_assignments", [])
        already = any(a.get("annotator_id") == current_user.id for a in existing)
        if not already:
            await database.project_working_collection.update_one(
                {"_id": pw["_id"]},
                {"$push": {"annotator_assignments": annotator_entry}},
            )

    return {"message": "Invite accepted successfully"}


@router.delete("/invites/{invite_id}")
async def delete_invite(
    invite_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Cancel/delete an invite (admin or project's manager)."""
    if not ObjectId.is_valid(invite_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite ID"
        )

    invite = await database.invites_collection.find_one({"_id": ObjectId(invite_id)})
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )

    project = await database.projects_collection.find_one({"_id": invite["project_id"]})
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager"
        and project
        and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this invite",
        )

    await database.invites_collection.delete_one({"_id": ObjectId(invite_id)})
    return {"message": "Invite canceled"}


# Get annotator task statistics
@router.get("/projects/{project_id}/annotator-stats")
async def get_annotator_task_stats(
    project_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """Get task completion statistics for annotators in a project (manager or admin only)"""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await database.projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Only admins or the project's manager can view statistics
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and project["manager_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view project statistics",
        )

    # Fetch all annotator task records for this project
    cursor = database.annotator_tasks_collection.find(
        {"project_id": ObjectId(project_id)}
    )
    annotator_tasks = await cursor.to_list(length=None)

    # Group statistics by annotator
    stats_by_annotator = {}
    for task_record in annotator_tasks:
        annotator_id = str(task_record["annotator_id"])

        if annotator_id not in stats_by_annotator:
            # Fetch annotator info
            annotator = await database.users_collection.find_one(
                {"_id": task_record["annotator_id"]}
            )
            stats_by_annotator[annotator_id] = {
                "annotator_id": annotator_id,
                "annotator_name": (
                    annotator.get("name", "Unknown") if annotator else "Unknown"
                ),
                "annotator_email": annotator.get("email", "") if annotator else "",
                "total_tasks_assigned": 0,
                "total_tasks_completed": 0,
                "total_time_seconds": 0,
                "average_time_seconds": 0,
                "tasks": [],
            }

        stats_by_annotator[annotator_id]["total_tasks_assigned"] += 1

        # Task is completed if completion_time is not None
        if task_record.get("completion_time") is not None:
            stats_by_annotator[annotator_id]["total_tasks_completed"] += 1
            completion_time = task_record.get("completion_time", 0)
            stats_by_annotator[annotator_id]["total_time_seconds"] += completion_time

            stats_by_annotator[annotator_id]["tasks"].append(
                {
                    "task_id": str(task_record["task_id"]),
                    "completion_time_seconds": completion_time,
                    "completion_time_formatted": f"{int(completion_time // 60)}m {int(completion_time % 60)}s",
                }
            )

    # Calculate averages
    for annotator_id in stats_by_annotator:
        completed = stats_by_annotator[annotator_id]["total_tasks_completed"]
        if completed > 0:
            avg_time = (
                stats_by_annotator[annotator_id]["total_time_seconds"] / completed
            )
            stats_by_annotator[annotator_id]["average_time_seconds"] = round(
                avg_time, 2
            )
            stats_by_annotator[annotator_id][
                "average_time_formatted"
            ] = f"{int(avg_time // 60)}m {int(avg_time % 60)}s"
        else:
            stats_by_annotator[annotator_id]["average_time_formatted"] = "N/A"

    return {
        "project_id": project_id,
        "project_name": project.get("name", ""),
        "annotators": list(stats_by_annotator.values()),
    }


# Get individual annotator's task history
@router.get("/annotators/my-task-history")
async def get_my_task_history(
    project_id: str = None,
    current_user: UserInDB = Depends(get_current_user),
):
    """Get task completion history for the current annotator"""
    if current_user.role != "annotator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for annotators only",
        )

    query = {"annotator_id": current_user.id}
    if project_id:
        if not ObjectId.is_valid(project_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
            )
        query["project_id"] = ObjectId(project_id)

    cursor = database.annotator_tasks_collection.find(query)
    task_records = await cursor.to_list(length=None)

    history = []
    for record in task_records:
        # Fetch task details
        task = await database.tasks_collection.find_one({"_id": record["task_id"]})
        project = await database.projects_collection.find_one(
            {"_id": record["project_id"]}
        )

        completion_time = record.get("completion_time")
        is_completed = completion_time is not None

        history.append(
            {
                "task_id": str(record["task_id"]),
                "project_id": str(record["project_id"]),
                "project_name": project.get("name", "") if project else "",
                "task_category": task.get("category", "") if task else "",
                "completion_time_seconds": completion_time,
                "completion_time_formatted": (
                    f"{int(completion_time // 60)}m {int(completion_time % 60)}s"
                    if is_completed
                    else "In Progress"
                ),
                "status": "Completed" if is_completed else "In Progress",
            }
        )

    return {
        "annotator_id": str(current_user.id),
        "annotator_name": current_user.name,
        "total_tasks": len(history),
        "completed_tasks": sum(1 for h in history if h["status"] == "Completed"),
        "history": history,
    }
