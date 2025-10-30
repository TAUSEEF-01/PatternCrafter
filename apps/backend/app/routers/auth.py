from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..schemas import UserCreate, UserOut, TokenResponse
from ..models import UserRole
from ..security import get_password_hash, verify_password, create_access_token
from ..deps import get_database

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register(
    user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Check if email exists
    existing = await db["users"].find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    doc = {
        "_id": user_id,
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": get_password_hash(user_in.password),
        "role": UserRole.user,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db["users"].insert_one(doc)
    return UserOut(id=user_id, name=doc["name"], email=doc["email"], role=doc["role"])  # type: ignore[arg-type]


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    user = await db["users"].find_one({"email": form_data.username})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token(
        user.get("_id"), expires_delta=timedelta(minutes=60 * 24 * 30)
    )
    return TokenResponse(access_token=token, user=UserOut(id=user.get("_id"), name=user.get("name"), email=user.get("email"), role=user.get("role")))  # type: ignore[arg-type]
