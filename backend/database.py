from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "patterncrafter")

client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None

# Collections
users_collection = None
projects_collection = None
tasks_collection = None
invites_collection = None
manager_projects_collection = None
project_working_collection = None
annotator_tasks_collection = None
notifications_collection = None


async def connect_to_mongo():
    """Create database connection"""
    global client, database
    global users_collection, projects_collection, tasks_collection
    global invites_collection, manager_projects_collection
    global project_working_collection, annotator_tasks_collection, notifications_collection

    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]

    # Initialize collections
    users_collection = database.get_collection("users")
    projects_collection = database.get_collection("projects")
    tasks_collection = database.get_collection("tasks")
    invites_collection = database.get_collection("invites")
    manager_projects_collection = database.get_collection("manager_projects")
    project_working_collection = database.get_collection("project_working")
    annotator_tasks_collection = database.get_collection("annotator_tasks")
    notifications_collection = database.get_collection("notifications")

    print("MongoDB connected successfully!")
    print(f"Collections initialized: users_collection={users_collection is not None}")

    # Create indexes for better performance
    await create_indexes()
    print("Indexes created successfully!")


async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()


async def create_indexes():
    """Create database indexes for better performance"""
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("role")
    await projects_collection.create_index("manager_id")
    await projects_collection.create_index("category")
    await tasks_collection.create_index("project_id")
    await tasks_collection.create_index("category")
    await tasks_collection.create_index("assigned_annotator_id")
    await tasks_collection.create_index(
        [("completed_status.annotator_part", 1), ("completed_status.qa_part", 1)]
    )
    await invites_collection.create_index([("project_id", 1), ("user_id", 1)])
    await invites_collection.create_index("accepted_status")
    await manager_projects_collection.create_index("project_id")
    await project_working_collection.create_index("project_id")
    await annotator_tasks_collection.create_index("project_id")
    await annotator_tasks_collection.create_index("annotator_id")
    await annotator_tasks_collection.create_index(
        [("task_id", 1), ("annotator_id", 1)], unique=True
    )
    await notifications_collection.create_index("recipient_id")
    await notifications_collection.create_index([("recipient_id", 1), ("is_read", 1)])
    await notifications_collection.create_index("created_at")


def get_database() -> AsyncIOMotorDatabase:
    return database
