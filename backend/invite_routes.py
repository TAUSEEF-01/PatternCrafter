"""Project invitation endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from datetime import datetime

import database
from schemas import InviteCreate, InviteResponse, UserInDB
from utils import as_response, get_current_user

router = APIRouter()


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

    # Send notification to the invited user
    notification = {
        "recipient_id": ObjectId(invite.user_id),
        "sender_id": current_user.id,
        "type": "invite",
        "title": "Project Invitation",
        "message": f"You have been invited to project: {project.get('details', 'Untitled Project')}",
        "project_id": ObjectId(project_id),
        "is_read": False,
        "created_at": datetime.utcnow(),
    }
    await database.notifications_collection.insert_one(notification)

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
