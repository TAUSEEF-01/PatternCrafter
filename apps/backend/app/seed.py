import asyncio
import uuid
from datetime import datetime, timezone
from .database import init_db, get_db
from .models import UserRole
from .security import get_password_hash


async def seed():
    await init_db()
    db = get_db()
    # Admin
    admin = await db["users"].find_one({"email": "admin@example.com"})
    if not admin:
        await db["users"].insert_one(
            {
                "_id": str(uuid.uuid4()),
                "name": "Admin",
                "email": "admin@example.com",
                "password_hash": get_password_hash("admin123"),
                "role": UserRole.admin,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
        )
    # Task Manager
    tm = await db["users"].find_one({"email": "manager@example.com"})
    if not tm:
        await db["users"].insert_one(
            {
                "_id": str(uuid.uuid4()),
                "name": "Task Manager",
                "email": "manager@example.com",
                "password_hash": get_password_hash("manager123"),
                "role": UserRole.task_manager,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
        )
    print("Seed complete: admin@example.com/admin123, manager@example.com/manager123")


if __name__ == "__main__":
    asyncio.run(seed())
