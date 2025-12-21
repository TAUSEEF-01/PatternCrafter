"""User management endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel

import database
from schemas import UserResponse, UserInDB
from services.user_service import UserService, UserServiceInterface
from utils import as_response, get_current_user

router = APIRouter()
user_service: UserServiceInterface = UserService()


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
    return await user_service.get_work_stats(current_user)
