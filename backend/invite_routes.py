"""Project invitation endpoints"""

from fastapi import APIRouter, Depends
from typing import List

from schemas import InviteCreate, InviteResponse, UserInDB
from services.invite_service import InviteService, InviteServiceInterface
from utils import get_current_user

router = APIRouter()
invite_service: InviteServiceInterface = InviteService()


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
    return await invite_service.create_invite(project_id, invite, current_user)


@router.get(
    "/invites", response_model=List[InviteResponse], response_model_by_alias=False
)
async def get_user_invites(current_user: UserInDB = Depends(get_current_user)):
    """Get invites for current user"""
    return await invite_service.get_user_invites(current_user)


@router.put("/invites/{invite_id}/accept")
async def accept_invite(
    invite_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Accept an invite"""
    return await invite_service.accept_invite(invite_id, current_user)


@router.delete("/invites/{invite_id}")
async def delete_invite(
    invite_id: str, current_user: UserInDB = Depends(get_current_user)
):
    """Cancel/delete an invite (admin or project's manager)."""
    return await invite_service.delete_invite(invite_id, current_user)
