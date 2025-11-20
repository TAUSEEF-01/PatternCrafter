import asyncio
import os
from typing import Optional
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorDatabase

load_dotenv()

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "patterncrafter")

# Module-level variables kept for compatibility
client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None

# Collections (will be set after connect)
users_collection = None
projects_collection = None
tasks_collection = None
invites_collection = None
manager_projects_collection = None
project_working_collection = None
annotator_tasks_collection = None
notifications_collection = None


class MongoDB:
    """Class-based singleton that holds the Motor client, database and collections.

    Use `await MongoDB.connect()` to initialize and get the singleton instance.
    """

    _instance: "MongoDB" = None
    _lock: Optional[asyncio.Lock] = None

    def __init__(self, client: AsyncIOMotorClient, database: AsyncIOMotorDatabase):
        self.client = client
        self.database = database
        # initialize collections
        self.users = database.get_collection("users")
        self.projects = database.get_collection("projects")
        self.tasks = database.get_collection("tasks")
        self.invites = database.get_collection("invites")
        self.manager_projects = database.get_collection("manager_projects")
        self.project_working = database.get_collection("project_working")
        self.annotator_tasks = database.get_collection("annotator_tasks")
        self.notifications = database.get_collection("notifications")

    @classmethod
    async def connect(cls) -> "MongoDB":
        """Idempotent async connect that returns the singleton instance."""
        if cls._instance is not None:
            return cls._instance

        # ensure lock exists and perform a safe async initialization
        if cls._lock is None:
            cls._lock = asyncio.Lock()

        async with cls._lock:
            if cls._instance is not None:
                return cls._instance

            print(f"Connecting to MongoDB at {MONGODB_URL}...")
            client = AsyncIOMotorClient(MONGODB_URL)
            database = client[DATABASE_NAME]

            inst = MongoDB(client, database)
            # create indexes
            await inst._create_indexes()

            cls._instance = inst
            print("MongoDB connected successfully!")
            return cls._instance

    async def close(self) -> None:
        if getattr(self, "client", None):
            self.client.close()
            type(self)._instance = None

    async def _create_indexes(self) -> None:
        await self.users.create_index("email", unique=True)
        await self.users.create_index("role")
        await self.projects.create_index("manager_id")
        await self.projects.create_index("category")
        await self.tasks.create_index("project_id")
        await self.tasks.create_index("category")
        await self.tasks.create_index("assigned_annotator_id")
        await self.tasks.create_index(
            [("completed_status.annotator_part", 1), ("completed_status.qa_part", 1)]
        )
        await self.invites.create_index([("project_id", 1), ("user_id", 1)])
        await self.invites.create_index("accepted_status")
        await self.manager_projects.create_index("project_id")
        await self.project_working.create_index("project_id")
        await self.annotator_tasks.create_index("project_id")
        await self.annotator_tasks.create_index("annotator_id")
        await self.annotator_tasks.create_index(
            [("task_id", 1), ("annotator_id", 1)], unique=True
        )
        await self.notifications.create_index("recipient_id")
        await self.notifications.create_index([("recipient_id", 1), ("is_read", 1)])
        await self.notifications.create_index("created_at")


async def connect_to_mongo():
    """Compatibility wrapper: initialize singleton and populate module-level names."""
    global client, database
    global users_collection, projects_collection, tasks_collection
    global invites_collection, manager_projects_collection
    global project_working_collection, annotator_tasks_collection, notifications_collection

    inst = await MongoDB.connect()

    # mirror instance attributes to module-level names for backward compatibility
    client = inst.client
    database = inst.database

    users_collection = inst.users
    projects_collection = inst.projects
    tasks_collection = inst.tasks
    invites_collection = inst.invites
    manager_projects_collection = inst.manager_projects
    project_working_collection = inst.project_working
    annotator_tasks_collection = inst.annotator_tasks
    notifications_collection = inst.notifications


async def close_mongo_connection():
    """Close database connection via singleton."""
    if MongoDB._instance is not None:
        await MongoDB._instance.close()


def get_database() -> AsyncIOMotorDatabase:
    return database

