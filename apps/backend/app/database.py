from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from urllib.parse import urlparse
from .config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def _get_db_name_from_url(url: str) -> str:
    parsed = urlparse(url)
    # path starts with '/dbname'
    dbname = (parsed.path or "/").lstrip("/") or "patterncrafter"
    return dbname


async def init_db() -> None:
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(settings.database_url)
        _db = _client[_get_db_name_from_url(settings.database_url)]

        # Create indexes
        await _db["users"].create_index("email", unique=True)
        await _db["templates"].create_index("title")
        await _db["tasks"].create_index("templateId")
        await _db["tasks"].create_index("assignedTo")
        await _db["annotations"].create_index("taskId")
        await _db["annotations"].create_index("userId")


def get_db() -> AsyncIOMotorDatabase:
    assert _db is not None, "Database not initialized; call init_db() on startup"
    return _db
