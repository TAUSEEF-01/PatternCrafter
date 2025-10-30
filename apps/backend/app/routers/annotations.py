from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from ..schemas import AnnotationCreate, AnnotationOut
from ..models import TaskStatus, UserRole
from ..deps import get_database, get_current_user, get_optional_user

router = APIRouter(prefix="/api/annotations", tags=["annotations"])


@router.get("", response_model=dict)
async def list_annotations(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict | None = Depends(get_optional_user),
):
    q: dict = {}
    if current_user and current_user.get("role") == UserRole.user:
        q["userId"] = current_user.get("_id")
    rows = await db["annotations"].find(q).to_list(None)
    return {
        "items": [
            AnnotationOut(
                id=r.get("_id"),
                templateId=r.get("templateId"),
                taskId=r.get("taskId"),
                submittedAt=r.get("submittedAt"),
                result=r.get("result"),
            )
            for r in rows
        ]
    }


@router.post("", response_model=AnnotationOut)
async def submit_annotation(
    payload: AnnotationCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict | None = Depends(get_optional_user),
):
    # Ensure task exists
    task = await db["tasks"].find_one({"_id": payload.taskId})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    annotation_id = str(uuid.uuid4())
    doc = {
        "_id": annotation_id,
        "templateId": payload.templateId,
        "taskId": payload.taskId,
        "userId": current_user.get("_id") if current_user else None,
        "result": payload.result,
        "submittedAt": uuid.uuid1().time,  # placeholder; prefer ISO datetime string
    }
    # Use ISO timestamp string
    from datetime import datetime, timezone

    doc["submittedAt"] = datetime.now(timezone.utc).isoformat()
    await db["annotations"].insert_one(doc)

    # Mark task completed
    await db["tasks"].update_one(
        {"_id": payload.taskId}, {"$set": {"status": TaskStatus.completed.value}}
    )
    return AnnotationOut(
        id=doc["_id"],
        templateId=doc["templateId"],
        taskId=doc["taskId"],
        submittedAt=doc["submittedAt"],
        result=doc["result"],
    )
