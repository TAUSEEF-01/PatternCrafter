from enum import Enum
from typing import Optional


class UserRole(str, Enum):
    admin = "admin"
    task_manager = "task_manager"
    user = "user"


class User:  # Mongo document shape (not an ORM model)
    _id: str
    name: str
    email: str
    password_hash: str
    role: UserRole
    createdAt: str


class Template:
    _id: str
    title: str
    type: Optional[str]
    group: Optional[str]
    image: Optional[str]
    details: Optional[str]
    config: str


class TaskStatus(str, Enum):
    unassigned = "unassigned"
    assigned = "assigned"
    completed = "completed"


class Task:
    _id: str
    templateId: str
    payload: dict
    status: TaskStatus
    assignedTo: Optional[str]
    createdBy: Optional[str]
    createdAt: str


class Annotation:
    _id: str
    templateId: str
    taskId: str
    userId: Optional[str]
    result: dict
    submittedAt: str
