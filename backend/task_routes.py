"""Task management endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime, timezone
import io
import csv
import json

import database
from schemas import (
    TaskCreate,
    TaskResponse,
    UserInDB,
    AssignTaskRequest,
    SubmitAnnotationRequest,
    SubmitQARequest,
    TaskCategory,
    TaskRemark,
    TaskRemarkCreate,
)
from utils import (
    as_response,
    get_current_user,
    DATA_MODEL_BY_CATEGORY,
    ANNOTATION_MODEL_BY_CATEGORY,
)

router = APIRouter()


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

    # Enforce task category matches project category
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
        "return_reason": None,
        "returned_by": None,
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

    # Permission check
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
    """List tasks in a project that have been completed (both annotator and QA parts)."""
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
    """Export fully completed tasks (annotator+QA) as CSV or JSON."""
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
        # For JSON export, return structured objects (not double-encoded strings)
        json_rows = []
        for r in rows:
            try:
                task_data_obj = (
                    json.loads(r.get("task_data", "{}")) if r.get("task_data") else {}
                )
            except json.JSONDecodeError:
                task_data_obj = {}
            try:
                annotation_obj = (
                    json.loads(r.get("annotation", "{}")) if r.get("annotation") else {}
                )
            except json.JSONDecodeError:
                annotation_obj = {}
            try:
                qa_annotation_obj = (
                    json.loads(r.get("qa_annotation", "{}"))
                    if r.get("qa_annotation")
                    else {}
                )
            except json.JSONDecodeError:
                qa_annotation_obj = {}
            json_rows.append(
                {
                    **r,
                    "task_data": task_data_obj,
                    "annotation": annotation_obj,
                    "qa_annotation": qa_annotation_obj,
                }
            )
        return JSONResponse(json_rows)

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
    """Get tasks in a project that are assigned to the current annotator."""
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

    # Check annotator is a member
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

    # Get all tasks assigned to this annotator
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

    # Send notification to annotator when task is assigned
    if payload.annotator_id:
        task_name = (
            task.get("tag_task")
            or f"Task in {project.get('details', 'Untitled Project')}"
        )
        notification = {
            "recipient_id": ObjectId(payload.annotator_id),
            "sender_id": current_user.id,
            "type": "task_assigned",
            "title": "New Task Assigned",
            "message": f"You have been assigned to task: {task_name}",
            "task_id": ObjectId(task_id),
            "return_reason": None,
            "returned_by": None,
            "remarks": [],
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

    # Send notification to QA reviewer when task is assigned for QA
    if payload.qa_id:
        task_name = (
            task.get("tag_task")
            or f"Task in {project.get('details', 'Untitled Project')}"
        )
        notification = {
            "recipient_id": ObjectId(payload.qa_id),
            "sender_id": current_user.id,
            "type": "qa_assigned",
            "title": "QA Review Assigned",
            "message": f"You have been assigned to review task: {task_name}",
            "task_id": ObjectId(task_id),
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

    # If annotator was assigned, update project_working
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
        annotator_task_entry = {
            "annotator_id": ObjectId(payload.annotator_id),
            "project_id": task["project_id"],
            "task_id": ObjectId(task_id),
            "completion_time": None,
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

    # Send notification to project manager when task is completed
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    if project and project.get("manager_id"):
        task_name = (
            task.get("tag_task")
            or f"Task in {project.get('details', 'Untitled Project')}"
        )
        notification = {
            "recipient_id": project["manager_id"],
            "sender_id": current_user.id,
            "type": "task_completed",
            "title": "Task Completed",
            "message": f"Task completed: {task_name}",
            "task_id": ObjectId(task_id),
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

    # Send notification to assigned QA reviewer when annotation is submitted
    if task.get("assigned_qa_id"):
        task_name = (
            task.get("tag_task")
            or f"Task in {project.get('details', 'Untitled Project')}"
        )
        notification = {
            "recipient_id": task["assigned_qa_id"],
            "sender_id": current_user.id,
            "type": "annotation_submitted",
            "title": "Annotation Submitted for Review",
            "message": f"Annotation submitted for task: {task_name}. Ready for QA review.",
            "task_id": ObjectId(task_id),
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

    # After submission: remove this task from project_working assigned task list
    if task.get("assigned_annotator_id"):
        await database.project_working_collection.update_one(
            {
                "project_id": task["project_id"],
                "annotator_assignments.annotator_id": task["assigned_annotator_id"],
            },
            {"$pull": {"annotator_assignments.$.task_ids": ObjectId(task_id)}},
        )

        # Update annotator_tasks_collection with completion time
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
                    "completion_time": total_time,
                }
            },
        )

    return {"message": "Annotation submitted"}


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
    if current_user.role == "admin":
        allowed = True
    elif current_user.role == "manager":
        # Managers may only submit QA if no QA annotator is assigned yet
        if not task.get("assigned_qa_id"):
            project = await database.projects_collection.find_one(
                {"_id": task["project_id"]}
            )
            allowed = project and project["manager_id"] == current_user.id
    elif current_user.role == "annotator":
        # Only the explicitly assigned QA annotator can submit QA
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

    # Save QA time spent if provided
    if payload.qa_time_spent is not None:
        updates["qa_accumulated_time"] = payload.qa_time_spent

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)}, {"$set": updates}
    )

    # Send notifications when QA is completed
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    task_name = (
        task.get("tag_task") or f"Task in {project.get('details', 'Untitled Project')}"
        if project
        else "Task"
    )

    # Notify project manager
    if project and project.get("manager_id"):
        notification = {
            "recipient_id": project["manager_id"],
            "sender_id": current_user.id,
            "type": "qa_completed",
            "title": "QA Review Completed",
            "message": f"QA review completed for task: {task_name}",
            "task_id": ObjectId(task_id),
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

    # Notify the annotator if task was approved
    if task.get("assigned_annotator_id") and not payload.qa_feedback:
        notification = {
            "recipient_id": task["assigned_annotator_id"],
            "sender_id": current_user.id,
            "type": "qa_approved",
            "title": "Task Approved",
            "message": f"Your annotation for task: {task_name} has been approved by QA.",
            "task_id": ObjectId(task_id),
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

    return {"message": "QA submitted"}


@router.put("/tasks/{task_id}/qa-time")
async def update_qa_accumulated_time(
    task_id: str,
    body: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_user),
):
    """Update QA accumulated time for a task (auto-save from frontend)"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Permission check - only assigned QA annotator can update their time
    if current_user.role == "annotator" and task.get("assigned_qa_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update QA time for this task",
        )

    qa_accumulated_time = body.get("qa_accumulated_time")
    if qa_accumulated_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="qa_accumulated_time is required",
        )

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"qa_accumulated_time": qa_accumulated_time}},
    )

    return {"message": "QA accumulated time updated"}


@router.put("/tasks/{task_id}/return")
async def return_task_to_annotator(
    task_id: str,
    body: Dict[str, Any] = None,
    current_user: UserInDB = Depends(get_current_user),
):
    """Return a completed task back to the annotator for revision (manager, admin, or assigned QA reviewer)"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Allow admins, the project's manager, or the assigned QA reviewer to return tasks
    project = await database.projects_collection.find_one({"_id": task["project_id"]})
    is_manager = (
        current_user.role == "manager"
        and project
        and project["manager_id"] == current_user.id
    )
    is_assigned_qa = task.get("assigned_qa_id") == current_user.id

    if current_user.role not in ["admin", "manager", "annotator"] or (
        current_user.role == "manager" and not is_manager
    ):
        if not is_assigned_qa:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to return this task",
            )

    # If user is annotator, they must be the assigned QA reviewer
    if current_user.role == "annotator" and not is_assigned_qa:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned QA reviewer can return this task",
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

    # Calculate accumulated time
    previous_accumulated_time = task.get("accumulated_time", 0) or 0
    new_accumulated_time = previous_accumulated_time + current_completion_time

    # Get return reason from request body
    return_reason = (body.get("return_reason", "") if body else "").strip()
    remark_message = (
        return_reason if return_reason else "Task returned for further revisions"
    )

    remark_entry = TaskRemark(
        message=remark_message,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role,
        remark_type="qa_return",
        created_at=datetime.utcnow(),
    )

    updates = {
        # Reset annotator completion so they can work again
        "completed_status.annotator_part": False,
        # Also reset QA completion so original QA must re-review after resubmission
        "completed_status.qa_part": False,
        "qa_annotation": None,
        "qa_feedback": None,
        "qa_completed_at": None,
        "is_returned": True,
        "return_reason": return_reason,
        "returned_by": current_user.id,
        "accumulated_time": new_accumulated_time,
        "annotator_completed_at": None,
    }

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": updates, "$push": {"remarks": remark_entry.model_dump(by_alias=True)}},
    )

    # Send notification to annotator when task is returned
    if task.get("assigned_annotator_id"):
        task_name = (
            task.get("tag_task")
            or f"Task in {project.get('details', 'Untitled Project')}"
            if project
            else "Task"
        )
        notification = {
            "recipient_id": task["assigned_annotator_id"],
            "sender_id": current_user.id,
            "type": "task_returned",
            "title": "Task Returned for Revision",
            "message": f"Task returned for revision: {task_name}. Please review feedback and resubmit.",
            "task_id": ObjectId(task_id),
            "project_id": task["project_id"],
            "is_read": False,
            "created_at": datetime.utcnow(),
        }
        await database.notifications_collection.insert_one(notification)

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

        # Reset completion time in annotator_tasks_collection
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


@router.post(
    "/tasks/{task_id}/remarks",
    response_model=TaskRemark,
    response_model_by_alias=False,
)
async def add_task_remark(
    task_id: str,
    payload: TaskRemarkCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    """Append a remark to a task's comment thread."""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID"
        )

    message = payload.message.strip() if payload and payload.message else ""
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Remark message cannot be empty",
        )

    task = await database.tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    project = await database.projects_collection.find_one({"_id": task["project_id"]})

    allowed = False
    if current_user.role == "admin":
        allowed = True
    elif current_user.role == "manager":
        allowed = project and project.get("manager_id") == current_user.id
    elif current_user.role == "annotator":
        allowed = current_user.id in [
            task.get("assigned_annotator_id"),
            task.get("assigned_qa_id"),
        ]

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add remarks to this task",
        )

    default_type_map = {
        "admin": "manager_note",
        "manager": "manager_note",
        "annotator": (
            "annotator_reply"
            if current_user.id == task.get("assigned_annotator_id")
            else "qa_note"
        ),
    }

    remark_type = (
        payload.remark_type
        if payload.remark_type
        else default_type_map.get(current_user.role, "qa_note")
    )

    remark = TaskRemark(
        message=message,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role,
        remark_type=remark_type,
        created_at=datetime.utcnow(),
    )

    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$push": {"remarks": remark.model_dump(by_alias=True)}},
    )

    return remark


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Delete a task (manager only, cannot delete assigned tasks)"""
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

    # Check if task is assigned to an annotator or QA
    if task.get("assigned_annotator_id") or task.get("assigned_qa_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete assigned task. Please unassign the task first.",
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


@router.put("/tasks/{task_id}/unassign")
async def unassign_task(
    task_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Unassign annotator and/or QA from a task (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can unassign tasks",
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
            detail="Not authorized to unassign this task",
        )

    update = {
        "assigned_annotator_id": None,
        "assigned_qa_id": None,
        "annotation": None,
        "qa_annotation": None,
        "qa_feedback": None,
        "completed_status": {"annotator_part": False, "qa_part": False},
        "is_returned": False,
        "annotator_started_at": None,
        "annotator_completed_at": None,
        "qa_started_at": None,
        "qa_completed_at": None,
    }

    # Update the task
    await database.tasks_collection.update_one(
        {"_id": ObjectId(task_id)}, {"$set": update}
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

    return {"message": "Task unassigned successfully"}


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
