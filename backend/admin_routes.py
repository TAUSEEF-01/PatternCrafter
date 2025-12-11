"""Admin management endpoints for platform statistics and monitoring"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from bson import ObjectId
from datetime import datetime, timedelta
from pydantic import BaseModel

import database
from schemas import UserInDB, UserResponse
from utils import as_response, get_current_user

router = APIRouter()


class PromoteToAdminRequest(BaseModel):
    user_id: str


def require_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    """Dependency to ensure current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("/admin/stats")
async def get_admin_stats(current_user: UserInDB = Depends(require_admin)):
    """Get platform-wide statistics for admin dashboard"""

    # Count total managers
    total_managers = await database.users_collection.count_documents(
        {"role": "manager"}
    )

    # Count total annotators
    total_annotators = await database.users_collection.count_documents(
        {"role": "annotator"}
    )

    # Count total projects
    total_projects = await database.projects_collection.count_documents({})

    # Count total tasks
    total_tasks = await database.tasks_collection.count_documents({})

    # Count completed tasks (where both annotator and QA parts are done)
    completed_tasks = await database.tasks_collection.count_documents(
        {"completed_status.annotator_part": True, "completed_status.qa_part": True}
    )

    # Count pending tasks
    pending_tasks = total_tasks - completed_tasks

    return {
        "total_managers": total_managers,
        "total_annotators": total_annotators,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
    }


@router.get("/admin/managers")
async def get_all_managers(current_user: UserInDB = Depends(require_admin)):
    """Get all managers with their project counts"""

    managers = await database.users_collection.find({"role": "manager"}).to_list(None)

    result = []
    for manager in managers:
        # Count projects created by this manager
        project_count = await database.projects_collection.count_documents(
            {"manager_id": manager["_id"]}
        )

        # Get list of projects for this manager
        projects = await database.projects_collection.find(
            {"manager_id": manager["_id"]}
        ).to_list(None)

        # Calculate total tasks across all projects
        total_tasks = 0
        completed_tasks = 0
        for project in projects:
            task_count = await database.tasks_collection.count_documents(
                {"project_id": project["_id"]}
            )
            total_tasks += task_count

            completed_count = await database.tasks_collection.count_documents(
                {
                    "project_id": project["_id"],
                    "completed_status.annotator_part": True,
                    "completed_status.qa_part": True,
                }
            )
            completed_tasks += completed_count

        manager_data = as_response(UserResponse, manager)
        result.append(
            {
                **manager_data.model_dump(),
                "project_count": project_count,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "created_at": manager.get("created_at", None),
            }
        )

    return result


@router.get("/admin/annotators")
async def get_all_annotators(current_user: UserInDB = Depends(require_admin)):
    """Get all annotators with their task statistics"""

    annotators = await database.users_collection.find({"role": "annotator"}).to_list(
        None
    )

    result = []
    for annotator in annotators:
        # Count tasks assigned to this annotator
        assigned_tasks = await database.tasks_collection.count_documents(
            {"assigned_annotator_id": annotator["_id"]}
        )

        # Count completed tasks by this annotator
        completed_tasks = await database.tasks_collection.count_documents(
            {
                "assigned_annotator_id": annotator["_id"],
                "completed_status.annotator_part": True,
            }
        )

        # Count tasks where they are assigned as QA
        qa_tasks = await database.tasks_collection.count_documents(
            {"assigned_qa_id": annotator["_id"]}
        )

        # Count completed QA tasks
        qa_completed = await database.tasks_collection.count_documents(
            {"assigned_qa_id": annotator["_id"], "completed_status.qa_part": True}
        )

        # Count projects they're invited to
        invited_projects = await database.invites_collection.count_documents(
            {"user_id": annotator["_id"], "accepted_status": True}
        )

        annotator_data = as_response(UserResponse, annotator)
        result.append(
            {
                **annotator_data.model_dump(),
                "assigned_tasks": assigned_tasks,
                "completed_tasks": completed_tasks,
                "qa_tasks": qa_tasks,
                "qa_completed": qa_completed,
                "invited_projects": invited_projects,
                "created_at": annotator.get("created_at", None),
            }
        )

    return result


@router.get("/admin/projects")
async def get_all_projects_admin(current_user: UserInDB = Depends(require_admin)):
    """Get all projects with detailed statistics for admin"""

    projects = await database.projects_collection.find().to_list(None)

    result = []
    for project in projects:
        # Get manager info
        manager = await database.users_collection.find_one(
            {"_id": project["manager_id"]}
        )
        manager_name = manager["name"] if manager else "Unknown"

        # Count tasks
        total_tasks = await database.tasks_collection.count_documents(
            {"project_id": project["_id"]}
        )

        completed_tasks = await database.tasks_collection.count_documents(
            {
                "project_id": project["_id"],
                "completed_status.annotator_part": True,
                "completed_status.qa_part": True,
            }
        )

        # Count invited annotators
        invited_count = await database.invites_collection.count_documents(
            {"project_id": project["_id"], "accepted_status": True}
        )

        result.append(
            {
                "id": str(project["_id"]),
                "details": project.get("details", ""),
                "category": project.get("category", ""),
                "manager_id": str(project["manager_id"]),
                "manager_name": manager_name,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "invited_annotators": invited_count,
                "created_at": project.get("created_at", None),
                "is_completed": project.get("is_completed", False),
            }
        )

    return result


@router.get("/admin/users")
async def get_all_users(current_user: UserInDB = Depends(require_admin)):
    """Get all users (non-admin) for admin management"""

    # Get all users except admins
    users = await database.users_collection.find(
        {"role": {"$in": ["manager", "annotator"]}}
    ).to_list(None)

    result = []
    for user in users:
        user_data = {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "created_at": user.get("created_at", None),
        }

        # Add role-specific data
        if user.get("role") == "annotator":
            user_data["skills"] = user.get("skills", [])
        elif user.get("role") == "manager":
            user_data["paid"] = user.get("paid", False)
            # Count projects for manager
            project_count = await database.projects_collection.count_documents(
                {"manager_id": user["_id"]}
            )
            user_data["project_count"] = project_count

        result.append(user_data)

    return result


@router.get("/admin/all-admins")
async def get_all_admins(current_user: UserInDB = Depends(require_admin)):
    """Get all admin users"""

    admins = await database.users_collection.find({"role": "admin"}).to_list(None)

    result = []
    for admin in admins:
        result.append(
            {
                "id": str(admin["_id"]),
                "name": admin.get("name", ""),
                "email": admin.get("email", ""),
                "role": "admin",
                "created_at": admin.get("created_at", None),
            }
        )

    return result


@router.post("/admin/promote-to-admin")
async def promote_user_to_admin(
    request: PromoteToAdminRequest, current_user: UserInDB = Depends(require_admin)
):
    """Promote a user (manager or annotator) to admin role"""

    if not ObjectId.is_valid(request.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID",
        )

    # Find the user
    user = await database.users_collection.find_one({"_id": ObjectId(request.user_id)})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check if user is already an admin
    if user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an admin",
        )

    # Update user role to admin
    await database.users_collection.update_one(
        {"_id": ObjectId(request.user_id)},
        {
            "$set": {"role": "admin"},
            "$unset": {"skills": "", "paid": ""},  # Remove role-specific fields
        },
    )

    # Get updated user
    updated_user = await database.users_collection.find_one(
        {"_id": ObjectId(request.user_id)}
    )

    return {
        "message": f"User {updated_user['name']} has been promoted to admin",
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user.get("name", ""),
            "email": updated_user.get("email", ""),
            "role": updated_user.get("role", ""),
        },
    }


@router.post("/admin/demote-from-admin")
async def demote_admin_to_manager(
    request: PromoteToAdminRequest, current_user: UserInDB = Depends(require_admin)
):
    """Demote an admin back to manager role"""

    if not ObjectId.is_valid(request.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID",
        )

    # Prevent self-demotion
    if str(current_user.id) == request.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot demote yourself",
        )

    # Find the user
    user = await database.users_collection.find_one({"_id": ObjectId(request.user_id)})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check if user is actually an admin
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not an admin",
        )

    # Update user role to manager
    await database.users_collection.update_one(
        {"_id": ObjectId(request.user_id)}, {"$set": {"role": "manager", "paid": False}}
    )

    # Get updated user
    updated_user = await database.users_collection.find_one(
        {"_id": ObjectId(request.user_id)}
    )

    return {
        "message": f"User {updated_user['name']} has been demoted to manager",
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user.get("name", ""),
            "email": updated_user.get("email", ""),
            "role": updated_user.get("role", ""),
        },
    }


@router.get("/admin/growth-data")
async def get_growth_data(current_user: UserInDB = Depends(require_admin)):
    """Get growth data for tasks, managers, and annotators over time"""

    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Initialize data for past 30 days
    daily_data = {}
    for i in range(30):
        date = start_of_today - timedelta(days=29 - i)
        date_str = date.strftime("%Y-%m-%d")
        daily_data[date_str] = {
            "date": date_str,
            "tasks_created": 0,
            "managers_registered": 0,
            "annotators_registered": 0,
            "cumulative_tasks": 0,
            "cumulative_managers": 0,
            "cumulative_annotators": 0,
        }

    # Get all tasks with created_at
    tasks = await database.tasks_collection.find(
        {"created_at": {"$exists": True}}
    ).to_list(None)

    # Get all managers with created_at
    managers = await database.users_collection.find(
        {"role": "manager", "created_at": {"$exists": True}}
    ).to_list(None)

    # Get all annotators with created_at
    annotators = await database.users_collection.find(
        {"role": "annotator", "created_at": {"$exists": True}}
    ).to_list(None)

    # Count tasks by date
    for task in tasks:
        created_at = task.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            date_str = created_at.strftime("%Y-%m-%d")
            if date_str in daily_data:
                daily_data[date_str]["tasks_created"] += 1

    # Count managers by date
    for manager in managers:
        created_at = manager.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            date_str = created_at.strftime("%Y-%m-%d")
            if date_str in daily_data:
                daily_data[date_str]["managers_registered"] += 1

    # Count annotators by date
    for annotator in annotators:
        created_at = annotator.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            date_str = created_at.strftime("%Y-%m-%d")
            if date_str in daily_data:
                daily_data[date_str]["annotators_registered"] += 1

    # Calculate cumulative totals
    # First, count everything before the 30-day window
    thirty_days_ago = start_of_today - timedelta(days=29)

    tasks_before = await database.tasks_collection.count_documents(
        {"created_at": {"$lt": thirty_days_ago}}
    )
    managers_before = await database.users_collection.count_documents(
        {"role": "manager", "created_at": {"$lt": thirty_days_ago}}
    )
    annotators_before = await database.users_collection.count_documents(
        {"role": "annotator", "created_at": {"$lt": thirty_days_ago}}
    )

    # Also count users without created_at (legacy users)
    tasks_no_date = await database.tasks_collection.count_documents(
        {"created_at": {"$exists": False}}
    )
    managers_no_date = await database.users_collection.count_documents(
        {"role": "manager", "created_at": {"$exists": False}}
    )
    annotators_no_date = await database.users_collection.count_documents(
        {"role": "annotator", "created_at": {"$exists": False}}
    )

    cumulative_tasks = tasks_before + tasks_no_date
    cumulative_managers = managers_before + managers_no_date
    cumulative_annotators = annotators_before + annotators_no_date

    # Convert to list and calculate cumulative
    result = []
    for i in range(30):
        date = start_of_today - timedelta(days=29 - i)
        date_str = date.strftime("%Y-%m-%d")
        day_data = daily_data[date_str]

        cumulative_tasks += day_data["tasks_created"]
        cumulative_managers += day_data["managers_registered"]
        cumulative_annotators += day_data["annotators_registered"]

        day_data["cumulative_tasks"] = cumulative_tasks
        day_data["cumulative_managers"] = cumulative_managers
        day_data["cumulative_annotators"] = cumulative_annotators

        result.append(day_data)

    # Weekly aggregation for the past 12 weeks
    weekly_data = []
    for week in range(12):
        week_end = start_of_today - timedelta(days=week * 7)
        week_start = week_end - timedelta(days=6)

        tasks_in_week = 0
        managers_in_week = 0
        annotators_in_week = 0

        for task in tasks:
            created_at = task.get("created_at")
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(
                        created_at.replace("Z", "+00:00")
                    )
                if week_start <= created_at.replace(tzinfo=None) <= week_end:
                    tasks_in_week += 1

        for manager in managers:
            created_at = manager.get("created_at")
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(
                        created_at.replace("Z", "+00:00")
                    )
                if week_start <= created_at.replace(tzinfo=None) <= week_end:
                    managers_in_week += 1

        for annotator in annotators:
            created_at = annotator.get("created_at")
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(
                        created_at.replace("Z", "+00:00")
                    )
                if week_start <= created_at.replace(tzinfo=None) <= week_end:
                    annotators_in_week += 1

        weekly_data.insert(
            0,
            {
                "week_start": week_start.strftime("%Y-%m-%d"),
                "week_end": week_end.strftime("%Y-%m-%d"),
                "week_label": f"Week {12 - week}",
                "tasks_created": tasks_in_week,
                "managers_registered": managers_in_week,
                "annotators_registered": annotators_in_week,
            },
        )

    return {
        "daily_data": result,
        "weekly_data": weekly_data,
        "totals": {
            "tasks": cumulative_tasks,
            "managers": cumulative_managers,
            "annotators": cumulative_annotators,
        },
    }
