from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from ..schemas import TaskCreate, TaskOut
from ..models import TaskStatus, UserRole
from ..deps import get_database, get_current_user, get_optional_user, require_role

router = APIRouter(prefix="/api", tags=["tasks"])


async def manager_only(user: dict = Depends(get_current_user)):
    return await require_role(user, UserRole.admin, UserRole.task_manager)


@router.get("/tasks", response_model=list[TaskOut])
async def list_tasks(
    templateId: str | None = Query(default=None),
    mine: bool = Query(default=False),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict | None = Depends(get_optional_user),
):
    q: dict = {}
    if templateId:
        q["templateId"] = templateId
    if mine and current_user:
        q["assignedTo"] = current_user.get("_id")
    rows = await db["tasks"].find(q).to_list(None)
    return [
        TaskOut(
            id=r.get("_id"),
            templateId=r.get("templateId"),
            payload=r.get("payload"),
            status=r.get("status"),
            assignedTo=r.get("assignedTo"),
        )
        for r in rows
    ]


@router.get("/templates/{template_id}/tasks", response_model=list[TaskOut])
async def list_template_tasks(
    template_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    rows = await db["tasks"].find({"templateId": template_id}).to_list(None)
    return [
        TaskOut(
            id=r.get("_id"),
            templateId=r.get("templateId"),
            payload=r.get("payload"),
            status=r.get("status"),
            assignedTo=r.get("assignedTo"),
        )
        for r in rows
    ]


@router.post("/tasks", response_model=TaskOut)
async def create_task(
    payload: TaskCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(manager_only),
    current_user: dict = Depends(get_current_user),
):
    # ensure template exists
    template = await db["templates"].find_one({"_id": payload.templateId})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    task_id = str(uuid.uuid4())
    doc = {
        "_id": task_id,
        "templateId": payload.templateId,
        "payload": payload.payload,
        "status": TaskStatus.unassigned.value,
        "assignedTo": None,
        "createdBy": current_user.get("_id"),
    }
    await db["tasks"].insert_one(doc)
    return TaskOut(
        id=task_id,
        templateId=payload.templateId,
        payload=payload.payload,
        status=TaskStatus.unassigned,
        assignedTo=None,
    )


@router.post("/tasks/{task_id}/assign", response_model=TaskOut)
async def assign_task(
    task_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(manager_only),
):
    task = await db["tasks"].find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.get("assignedTo") and task.get("assignedTo") != user_id:
        raise HTTPException(status_code=400, detail="Task already assigned")

    user = await db["users"].find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db["tasks"].update_one(
        {"_id": task_id},
        {"$set": {"assignedTo": user_id, "status": TaskStatus.assigned.value}},
    )
    updated = await db["tasks"].find_one({"_id": task_id})
    return TaskOut(
        id=updated.get("_id"),
        templateId=updated.get("templateId"),
        payload=updated.get("payload"),
        status=updated.get("status"),
        assignedTo=updated.get("assignedTo"),
    )
