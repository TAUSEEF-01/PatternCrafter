"""Authentication endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime

import database
from schemas import UserCreate, UserResponse, LoginRequest, Token
from auth import get_password_hash, verify_password, create_access_token
from utils import as_response, get_current_user
from schemas import UserInDB

router = APIRouter()


@router.post(
    "/auth/register", response_model=UserResponse, response_model_by_alias=False
)
async def register_user(user: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await database.users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Hash password
    hashed_password = get_password_hash(user.password)

    # Create user document
    user_dict = user.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    user_dict["created_at"] = datetime.utcnow()

    # Add role-specific fields
    if user.role == "manager":
        user_dict["paid"] = False
    elif user.role == "annotator":
        user_dict["skills"] = []

    # Insert user
    result = await database.users_collection.insert_one(user_dict)

    # Get created user
    created_user = await database.users_collection.find_one({"_id": result.inserted_id})
    return as_response(UserResponse, created_user)


@router.post("/auth/login", response_model=Token)
async def login(login_request: LoginRequest):
    """Login user and return access token"""
    user = await database.users_collection.find_one({"email": login_request.email})
    if not user or not verify_password(login_request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse, response_model_by_alias=False)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information"""
    # Use by_alias to provide `_id` and coerce ObjectId to string for response model
    from bson import ObjectId

    data = current_user.model_dump(by_alias=True)
    _id = data.get("_id", current_user.id)
    if isinstance(_id, ObjectId):
        data["_id"] = str(_id)
    else:
        data["_id"] = str(current_user.id)
    return UserResponse(**data)
