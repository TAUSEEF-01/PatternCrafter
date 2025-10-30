from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from .models import UserRole, TaskStatus


# User
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Templates
class TemplateCreate(BaseModel):
    title: str
    type: Optional[str] = None
    group: Optional[str] = None
    image: Optional[str] = None
    details: Optional[str] = None
    config: str = Field(..., description="JSON string for template config")


class TemplateOut(BaseModel):
    id: str
    title: str
    type: Optional[str] = None
    group: Optional[str] = None
    image: Optional[str] = None
    details: Optional[str] = None
    config: str

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    templateId: str
    payload: dict


class TaskOut(BaseModel):
    id: str
    templateId: str
    payload: dict
    status: TaskStatus
    assignedTo: Optional[str] = None

    class Config:
        from_attributes = True


# Annotations
class AnnotationCreate(BaseModel):
    templateId: str
    taskId: str
    result: dict


class AnnotationOut(BaseModel):
    id: str
    templateId: str
    taskId: str
    submittedAt: datetime
    result: dict

    class Config:
        from_attributes = True


# Admin
class StatsOut(BaseModel):
    total_users: int
    total_task_managers: int
    total_admins: int
    total_tasks: int
    completed_tasks: int
    assigned_tasks: int
    unassigned_tasks: int
