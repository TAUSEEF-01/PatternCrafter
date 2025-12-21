from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict

from bson import ObjectId
from fastapi import HTTPException, status

import database
from db_utils import send_invite_notification
from schemas import InviteCreate, InviteResponse, UserInDB
from utils import as_response


class InviteServiceInterface(ABC):
    @abstractmethod
    async def create_invite(
        self, project_id: str, invite: InviteCreate, current_user: UserInDB
    ) -> InviteResponse:
        raise NotImplementedError

    @abstractmethod
    async def get_user_invites(self, current_user: UserInDB) -> List[InviteResponse]:
        raise NotImplementedError

    @abstractmethod
    async def accept_invite(self, invite_id: str, current_user: UserInDB) -> Dict[str, str]:
        raise NotImplementedError

    @abstractmethod
    async def delete_invite(self, invite_id: str, current_user: UserInDB) -> Dict[str, str]:
        raise NotImplementedError


class InviteService(InviteServiceInterface):
    async def create_invite(
        self, project_id: str, invite: InviteCreate, current_user: UserInDB
    ) -> InviteResponse:
        if not ObjectId.is_valid(project_id) or not ObjectId.is_valid(invite.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID or user ID",
            )

        project_obj_id = ObjectId(project_id)
        invitee_obj_id = ObjectId(invite.user_id)

        project = await database.projects_collection.find_one({"_id": project_obj_id})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        if current_user.role != "manager" or project.get("manager_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project managers can create invites",
            )

        user = await database.users_collection.find_one({"_id": invitee_obj_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        existing_invite = await database.invites_collection.find_one(
            {"project_id": project_obj_id, "user_id": invitee_obj_id}
        )
        if existing_invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite already exists for this user",
            )

        invite_dict = {
            "project_id": project_obj_id,
            "user_id": invitee_obj_id,
            "accepted_status": False,
            "invited_at": datetime.utcnow(),
            "accepted_at": None,
        }

        result = await database.invites_collection.insert_one(invite_dict)
        created_invite = await database.invites_collection.find_one(
            {"_id": result.inserted_id}
        )

        project_name = project.get("details", "Untitled Project")
        await send_invite_notification(
            invitee_id=invitee_obj_id,
            inviter_id=current_user.id,
            project_id=project_obj_id,
            project_name=project_name,
        )

        return as_response(InviteResponse, created_invite)

    async def get_user_invites(self, current_user: UserInDB) -> List[InviteResponse]:
        invites = await database.invites_collection.find(
            {"user_id": current_user.id}
        ).to_list(None)
        return [as_response(InviteResponse, invite) for invite in invites]

    async def accept_invite(self, invite_id: str, current_user: UserInDB) -> Dict[str, str]:
        if not ObjectId.is_valid(invite_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite ID"
            )

        invite = await database.invites_collection.find_one({"_id": ObjectId(invite_id)})
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
            )

        if invite.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to accept this invite",
            )

        if invite.get("accepted_status"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already accepted"
            )

        await database.invites_collection.update_one(
            {"_id": ObjectId(invite_id)},
            {"$set": {"accepted_status": True, "accepted_at": datetime.utcnow()}},
        )

        project_id = invite.get("project_id")
        pw = await database.project_working_collection.find_one({"project_id": project_id})

        annotator_entry = {
            "annotator_id": current_user.id,
            "task_ids": [],
            "assigned_at": datetime.utcnow(),
        }

        if pw is None:
            await database.project_working_collection.insert_one(
                {
                    "project_id": project_id,
                    "annotator_assignments": [annotator_entry],
                    "created_at": datetime.utcnow(),
                }
            )
        else:
            existing = pw.get("annotator_assignments", [])
            already = any(a.get("annotator_id") == current_user.id for a in existing)
            if not already:
                await database.project_working_collection.update_one(
                    {"_id": pw.get("_id")},
                    {"$push": {"annotator_assignments": annotator_entry}},
                )

        return {"message": "Invite accepted successfully"}

    async def delete_invite(self, invite_id: str, current_user: UserInDB) -> Dict[str, str]:
        if not ObjectId.is_valid(invite_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite ID"
            )

        invite = await database.invites_collection.find_one({"_id": ObjectId(invite_id)})
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
            )

        project = await database.projects_collection.find_one({"_id": invite.get("project_id")})
        unauthorized_manager = (
            current_user.role == "manager"
            and project
            and project.get("manager_id") != current_user.id
        )
        if current_user.role not in ["admin", "manager"] or unauthorized_manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this invite",
            )

        await database.invites_collection.delete_one({"_id": ObjectId(invite_id)})
        return {"message": "Invite canceled"}
