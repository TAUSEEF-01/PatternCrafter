"""Notification endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId

import database
from schemas import NotificationResponse, UserInDB
from utils import as_response, get_current_user

router = APIRouter()


@router.get(
    "/notifications",
    response_model=List[NotificationResponse],
    response_model_by_alias=False,
)
async def get_notifications(
    limit: int = 50, current_user: UserInDB = Depends(get_current_user)
):
    """Get all notifications for current user"""
    notifications = (
        await database.notifications_collection.find({"recipient_id": current_user.id})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(limit)
    )
    return [as_response(NotificationResponse, notif) for notif in notifications]


@router.get("/notifications/unread-count")
async def get_unread_count(current_user: UserInDB = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await database.notifications_collection.count_documents(
        {"recipient_id": current_user.id, "is_read": False}
    )
    return {"unread_count": count}


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Mark notification as read"""
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid notification ID"
        )

    notification = await database.notifications_collection.find_one(
        {"_id": ObjectId(notification_id)}
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )

    if notification["recipient_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this notification",
        )

    await database.notifications_collection.update_one(
        {"_id": ObjectId(notification_id)}, {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}


@router.patch("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: UserInDB = Depends(get_current_user),
):
    """Mark all user's notifications as read"""
    result = await database.notifications_collection.update_many(
        {"recipient_id": current_user.id, "is_read": False},
        {"$set": {"is_read": True}},
    )
    return {"message": f"Marked {result.modified_count} notifications as read"}
