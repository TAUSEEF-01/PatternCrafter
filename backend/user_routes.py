"""User management endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime, timedelta

import database
from schemas import UserResponse, UserInDB
from utils import as_response, get_current_user

router = APIRouter()


class UpdateSkillsRequest(BaseModel):
    skills: List[str]


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


@router.get("/users/me/work-stats")
async def get_my_work_stats(current_user: UserInDB = Depends(get_current_user)):
    """Get work statistics for the current annotator including total hours and daily breakdown"""
    if current_user.role != "annotator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only annotators can view work stats",
        )

    # Get all tasks where this user is assigned as annotator or QA
    annotator_tasks = await database.tasks_collection.find(
        {"assigned_annotator_id": current_user.id}
    ).to_list(None)

    qa_tasks = await database.tasks_collection.find(
        {"assigned_qa_id": current_user.id}
    ).to_list(None)

    # Calculate total hours
    total_annotation_seconds = 0
    total_qa_seconds = 0

    # Track daily hours for the past 30 days
    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week = start_of_today - timedelta(days=start_of_today.weekday())
    start_of_month = start_of_today.replace(day=1)

    # Initialize daily data for past 30 days
    daily_hours = {}
    for i in range(30):
        date = (start_of_today - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_hours[date] = {"annotation": 0, "qa": 0}

    # Process annotation tasks
    for task in annotator_tasks:
        accumulated_time = task.get("accumulated_time", 0) or 0
        total_annotation_seconds += accumulated_time

        # Get completion date for daily breakdown
        completed_at = task.get("annotator_completed_at")
        if completed_at and accumulated_time > 0:
            if isinstance(completed_at, str):
                completed_at = datetime.fromisoformat(
                    completed_at.replace("Z", "+00:00")
                )
            date_str = completed_at.strftime("%Y-%m-%d")
            if date_str in daily_hours:
                daily_hours[date_str]["annotation"] += accumulated_time

    # Process QA tasks
    for task in qa_tasks:
        qa_time = task.get("qa_accumulated_time", 0) or 0
        total_qa_seconds += qa_time

        # Get QA completion date for daily breakdown
        qa_completed_at = task.get("qa_completed_at")
        if qa_completed_at and qa_time > 0:
            if isinstance(qa_completed_at, str):
                qa_completed_at = datetime.fromisoformat(
                    qa_completed_at.replace("Z", "+00:00")
                )
            date_str = qa_completed_at.strftime("%Y-%m-%d")
            if date_str in daily_hours:
                daily_hours[date_str]["qa"] += qa_time

    # Calculate this week and this month totals
    week_annotation_seconds = 0
    week_qa_seconds = 0
    month_annotation_seconds = 0
    month_qa_seconds = 0

    for date_str, hours in daily_hours.items():
        date = datetime.strptime(date_str, "%Y-%m-%d")
        if date >= start_of_week:
            week_annotation_seconds += hours["annotation"]
            week_qa_seconds += hours["qa"]
        if date >= start_of_month:
            month_annotation_seconds += hours["annotation"]
            month_qa_seconds += hours["qa"]

    # Convert to hours
    def seconds_to_hours(s):
        return round(s / 3600, 2)

    # Prepare daily data for charts (last 7 days and last 30 days)
    weekly_data = []
    for i in range(6, -1, -1):
        date = start_of_today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        day_name = date.strftime("%a")
        hours_data = daily_hours.get(date_str, {"annotation": 0, "qa": 0})
        weekly_data.append(
            {
                "date": date_str,
                "day": day_name,
                "annotation_hours": seconds_to_hours(hours_data["annotation"]),
                "qa_hours": seconds_to_hours(hours_data["qa"]),
                "total_hours": seconds_to_hours(
                    hours_data["annotation"] + hours_data["qa"]
                ),
            }
        )

    monthly_data = []
    for i in range(29, -1, -1):
        date = start_of_today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        hours_data = daily_hours.get(date_str, {"annotation": 0, "qa": 0})
        monthly_data.append(
            {
                "date": date_str,
                "annotation_hours": seconds_to_hours(hours_data["annotation"]),
                "qa_hours": seconds_to_hours(hours_data["qa"]),
                "total_hours": seconds_to_hours(
                    hours_data["annotation"] + hours_data["qa"]
                ),
            }
        )

    return {
        "total_hours": {
            "annotation": seconds_to_hours(total_annotation_seconds),
            "qa": seconds_to_hours(total_qa_seconds),
            "total": seconds_to_hours(total_annotation_seconds + total_qa_seconds),
        },
        "this_week": {
            "annotation": seconds_to_hours(week_annotation_seconds),
            "qa": seconds_to_hours(week_qa_seconds),
            "total": seconds_to_hours(week_annotation_seconds + week_qa_seconds),
        },
        "this_month": {
            "annotation": seconds_to_hours(month_annotation_seconds),
            "qa": seconds_to_hours(month_qa_seconds),
            "total": seconds_to_hours(month_annotation_seconds + month_qa_seconds),
        },
        "tasks_completed": {
            "annotation": len(
                [
                    t
                    for t in annotator_tasks
                    if t.get("completed_status", {}).get("annotator_part")
                ]
            ),
            "qa": len(
                [t for t in qa_tasks if t.get("completed_status", {}).get("qa_part")]
            ),
        },
        "tasks_assigned": {
            "annotation": len(annotator_tasks),
            "qa": len(qa_tasks),
        },
        "weekly_data": weekly_data,
        "monthly_data": monthly_data,
    }
