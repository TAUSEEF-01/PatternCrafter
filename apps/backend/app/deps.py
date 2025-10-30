from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from .database import get_db
from .models import UserRole
from .config import settings

reuseable_oauth = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_database() -> AsyncIOMotorDatabase:
    return get_db()


async def get_current_user(
    token: Annotated[str, Depends(reuseable_oauth)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = sub
    except (JWTError, ValueError):
        raise credentials_exception

    user = await db["users"].find_one({"_id": str(user_id)})
    if user is None:
        raise credentials_exception
    return user


async def require_role(
    user: Annotated[dict, Depends(get_current_user)], *roles: UserRole
) -> dict:
    if roles and user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


async def get_optional_user(
    token: Annotated[str | None, Depends(reuseable_oauth)] = None,  # type: ignore[assignment]
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)] = None,  # type: ignore[assignment]
) -> dict | None:
    try:
        if token is None:
            return None
        return await get_current_user(token=token, db=db)
    except Exception:
        return None
