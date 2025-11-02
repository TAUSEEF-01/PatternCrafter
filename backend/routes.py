from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime

from database import (
    users_collection,
    projects_collection,
    tasks_collection,
    invites_collection,
    manager_projects_collection,
    project_working_collection,
    annotator_tasks_collection,
)
from schemas import *
from auth import get_password_hash, verify_password, create_access_token, verify_token

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

    user = await users_collection.find_one({"email": email})
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


# Authentication endpoints
@router.post("/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
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
    result = await users_collection.insert_one(user_dict)

    # Get created user
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    return UserResponse(**created_user)


@router.post("/auth/login", response_model=Token)
async def login(login_request: LoginRequest):
    """Login user and return access token"""
    user = await users_collection.find_one({"email": login_request.email})
    if not user or not verify_password(login_request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user.dict())


# User endpoints
@router.get("/users", response_model=List[UserResponse])
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

    users = await users_collection.find(query).to_list(None)
    return [UserResponse(**user) for user in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Get user by ID"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
        )

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserResponse(**user)


# Project endpoints
@router.post("/projects", response_model=ProjectResponse)
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

    result = await projects_collection.insert_one(project_dict)
    created_project = await projects_collection.find_one({"_id": result.inserted_id})

    return ProjectResponse(**created_project)


@router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: UserInDB = Depends(get_current_user)):
    """Get projects based on user role"""
    if current_user.role == "manager":
        # Managers see their own projects
        projects = await projects_collection.find(
            {"manager_id": current_user.id}
        ).to_list(None)
    elif current_user.role == "admin":
        # Admins see all projects
        projects = await projects_collection.find().to_list(None)
    else:
        # Annotators see projects they're invited to
        invites = await invites_collection.find(
            {"user_id": current_user.id, "accepted_status": True}
        ).to_list(None)
        project_ids = [invite["project_id"] for invite in invites]
        projects = await projects_collection.find(
            {"_id": {"$in": project_ids}}
        ).to_list(None)

    return [ProjectResponse(**project) for project in projects]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Get project by ID"""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
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
        # Check if annotator is invited to this project
        invite = await invites_collection.find_one(
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

    return ProjectResponse(**project)


# Task endpoints
@router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
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
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
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

    # Enforce task category matches project category (optional but recommended)
    if str(project.get("category")) != str(task.category):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task category must match project's category",
        )

    # Validate task_data based on category
    model = DATA_MODEL_BY_CATEGORY.get(task.category)
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
        "category": task.category,
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

    result = await tasks_collection.insert_one(task_dict)

    # Update project with new task ID
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$push": {"task_ids": result.inserted_id}}
    )

    created_task = await tasks_collection.find_one({"_id": result.inserted_id})
    return TaskResponse(**created_task)


@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def get_project_tasks(
    project_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Get all tasks for a project"""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID"
        )

    # Check if project exists and user has permission
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
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
        invite = await invites_collection.find_one(
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

    tasks = await tasks_collection.find({"project_id": ObjectId(project_id)}).to_list(
        None
    )
    return [TaskResponse(**task) for task in tasks]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Get single task by ID if user has access"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    # Permission: must be admin, project manager, or invited annotator
    project = await projects_collection.find_one({"_id": task["project_id"]})
    if current_user.role == "admin":
        return TaskResponse(**task)
    if (
        current_user.role == "manager"
        and project
        and project["manager_id"] == current_user.id
    ):
        return TaskResponse(**task)
    if current_user.role == "annotator":
        invite = await invites_collection.find_one(
            {
                "project_id": task["project_id"],
                "user_id": current_user.id,
                "accepted_status": True,
            }
        )
        if invite:
            return TaskResponse(**task)
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

    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Only admins or the project's manager can assign
    project = await projects_collection.find_one({"_id": task["project_id"]})
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
        update["assigned_annotator_id"] = ObjectId(payload.annotator_id)
        # Set annotator_started_at if not present
        if not task.get("annotator_started_at"):
            update["annotator_started_at"] = datetime.utcnow()

    if payload.qa_id:
        if not ObjectId.is_valid(payload.qa_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid qa_id"
            )
        update["assigned_qa_id"] = ObjectId(payload.qa_id)
        if not task.get("qa_started_at"):
            update["qa_started_at"] = datetime.utcnow()

    if not update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No assignment provided"
        )

    await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": update})
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

    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Permission: only assigned annotator or admin/manager
    allowed = False
    if current_user.role in ["admin"]:
        allowed = True
    elif current_user.role == "manager":
        project = await projects_collection.find_one({"_id": task["project_id"]})
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
    annotation_dict: Dict[str, Any]
    if ann_model is not None:
        try:
            annotation_dict = ann_model(**payload.annotation).model_dump()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid annotation for category {category}: {e}",
            )
    else:
        annotation_dict = payload.annotation

    updates = {
        "annotation": annotation_dict,
        "completed_status.annotator_part": True,
        "annotator_completed_at": datetime.utcnow(),
    }

    await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": updates})
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

    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Permission check
    allowed = False
    if current_user.role in ["admin"]:
        allowed = True
    elif current_user.role == "manager":
        project = await projects_collection.find_one({"_id": task["project_id"]})
        allowed = project and project["manager_id"] == current_user.id
    elif current_user.role == "annotator":
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

    await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": updates})
    return {"message": "QA submitted"}


# Invite endpoints
@router.post("/projects/{project_id}/invites", response_model=InviteResponse)
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
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
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
    user = await users_collection.find_one({"_id": ObjectId(invite.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check if invite already exists
    existing_invite = await invites_collection.find_one(
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

    result = await invites_collection.insert_one(invite_dict)
    created_invite = await invites_collection.find_one({"_id": result.inserted_id})

    return InviteResponse(**created_invite)


@router.get("/invites", response_model=List[InviteResponse])
async def get_user_invites(current_user: UserInDB = Depends(get_current_user)):
    """Get invites for current user"""
    invites = await invites_collection.find({"user_id": current_user.id}).to_list(None)
    return [InviteResponse(**invite) for invite in invites]


@router.put("/invites/{invite_id}/accept")
async def accept_invite(
    invite_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Accept an invite"""
    if not ObjectId.is_valid(invite_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite ID"
        )

    invite = await invites_collection.find_one({"_id": ObjectId(invite_id)})
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

    await invites_collection.update_one(
        {"_id": ObjectId(invite_id)},
        {"$set": {"accepted_status": True, "accepted_at": datetime.utcnow()}},
    )

    return {"message": "Invite accepted successfully"}
