from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..schemas import StatsOut, UserOut
from ..models import UserRole, TaskStatus
from ..deps import get_database, get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["admin"])


async def admin_only(user: dict = Depends(get_current_user)):
    return await require_role(user, UserRole.admin)


@router.get("/stats", response_model=StatsOut)
async def stats(
    db: AsyncIOMotorDatabase = Depends(get_database), _: dict = Depends(admin_only)
):
    total_users = await db["users"].count_documents({})
    total_task_managers = await db["users"].count_documents(
        {"role": UserRole.task_manager}
    )
    total_admins = await db["users"].count_documents({"role": UserRole.admin})
    total_tasks = await db["tasks"].count_documents({})
    completed_tasks = await db["tasks"].count_documents(
        {"status": TaskStatus.completed.value}
    )
    assigned_tasks = await db["tasks"].count_documents(
        {"status": TaskStatus.assigned.value}
    )
    unassigned_tasks = await db["tasks"].count_documents(
        {"status": TaskStatus.unassigned.value}
    )
    return StatsOut(
        total_users=total_users,
        total_task_managers=total_task_managers,
        total_admins=total_admins,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        assigned_tasks=assigned_tasks,
        unassigned_tasks=unassigned_tasks,
    )


@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: str,
    role: UserRole,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(admin_only),
):
    user = await db["users"].find_one({"_id": str(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db["users"].update_one({"_id": str(user_id)}, {"$set": {"role": role}})
    updated = await db["users"].find_one({"_id": str(user_id)})
    return UserOut(id=updated.get("_id"), name=updated.get("name"), email=updated.get("email"), role=updated.get("role"))  # type: ignore[arg-type]
