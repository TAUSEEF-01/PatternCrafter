from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict

from fastapi import HTTPException, status

import database
from schemas import UserInDB


class UserServiceInterface(ABC):
    @abstractmethod
    async def get_work_stats(self, current_user: UserInDB) -> Dict:
        """Return work statistics for the given annotator user."""
        raise NotImplementedError


class UserService(UserServiceInterface):
    async def get_work_stats(self, current_user: UserInDB) -> Dict:
        if current_user.role != "annotator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only annotators can view work stats",
            )

        annotator_tasks = await database.tasks_collection.find(
            {"assigned_annotator_id": current_user.id}
        ).to_list(None)

        qa_tasks = await database.tasks_collection.find(
            {"assigned_qa_id": current_user.id}
        ).to_list(None)

        total_annotation_seconds = 0
        total_qa_seconds = 0

        now = datetime.utcnow()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = start_of_today - timedelta(days=start_of_today.weekday())
        start_of_month = start_of_today.replace(day=1)

        daily_hours = {}
        for i in range(30):
            date = (start_of_today - timedelta(days=i)).strftime("%Y-%m-%d")
            daily_hours[date] = {"annotation": 0, "qa": 0}

        for task in annotator_tasks:
            accumulated_time = task.get("accumulated_time", 0) or 0
            total_annotation_seconds += accumulated_time

            completed_at = task.get("annotator_completed_at")
            if completed_at and accumulated_time > 0:
                if isinstance(completed_at, str):
                    completed_at = datetime.fromisoformat(
                        completed_at.replace("Z", "+00:00")
                    )
                date_str = completed_at.strftime("%Y-%m-%d")
                if date_str in daily_hours:
                    daily_hours[date_str]["annotation"] += accumulated_time

        for task in qa_tasks:
            qa_time = task.get("qa_accumulated_time", 0) or 0
            total_qa_seconds += qa_time

            qa_completed_at = task.get("qa_completed_at")
            if qa_completed_at and qa_time > 0:
                if isinstance(qa_completed_at, str):
                    qa_completed_at = datetime.fromisoformat(
                        qa_completed_at.replace("Z", "+00:00")
                    )
                date_str = qa_completed_at.strftime("%Y-%m-%d")
                if date_str in daily_hours:
                    daily_hours[date_str]["qa"] += qa_time

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

        def seconds_to_hours(seconds: float) -> float:
            return round(seconds / 3600, 2)

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
                        task
                        for task in annotator_tasks
                        if task.get("completed_status", {}).get("annotator_part")
                    ]
                ),
                "qa": len(
                    [task for task in qa_tasks if task.get("completed_status", {}).get("qa_part")]
                ),
            },
            "tasks_assigned": {
                "annotation": len(annotator_tasks),
                "qa": len(qa_tasks),
            },
            "weekly_data": weekly_data,
            "monthly_data": monthly_data,
        }
