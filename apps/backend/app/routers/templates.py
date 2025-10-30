from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from ..schemas import TemplateCreate, TemplateOut
from ..models import UserRole
from ..deps import get_database, get_current_user, require_role

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[TemplateOut])
async def list_templates(db: AsyncIOMotorDatabase = Depends(get_database)):
    items = [
        TemplateOut(**{**t, "id": t.get("_id")})
        for t in await db["templates"].find().to_list(None)
    ]
    return items


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    template = await db["templates"].find_one({"_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateOut(**{**template, "id": template.get("_id")})


async def admin_or_tm(user: dict = Depends(get_current_user)):
    return await require_role(user, UserRole.admin, UserRole.task_manager)


@router.post("", response_model=TemplateOut)
async def create_template(
    payload: TemplateCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(admin_or_tm),
):
    template_id = str(uuid.uuid4())
    doc = {"_id": template_id, **payload.model_dump()}
    await db["templates"].insert_one(doc)
    return TemplateOut(id=template_id, **payload.model_dump())
