"""Project management endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from datetime import datetime

import database
from schemas import (
    ProjectCreate,
    ProjectResponse,
    UserInDB,
    InviteResponse,
    UserResponse,
)
from utils import as_response, get_current_user

router = APIRouter()


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
