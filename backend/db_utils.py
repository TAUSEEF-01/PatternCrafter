"""
Database utilities for admin operations and data management
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
from auth import get_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "patterncrafter")


async def create_admin_user():
    """Create a default admin user for initial setup"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    users_collection = database.get_collection("users")

    # Check if admin already exists
    admin_exists = await users_collection.find_one({"role": "admin"})
    if admin_exists:
        print("Admin user already exists")
        return

    # Create admin user
    admin_user = {
        "name": "Admin User",
        "email": "admin@patterncrafter.com",
        "role": "admin",
        "hashed_password": get_password_hash("admin123"),  # Change this password!
        "created_at": datetime.utcnow(),
    }

    result = await users_collection.insert_one(admin_user)
    print(f"Admin user created with ID: {result.inserted_id}")
    print("Email: admin@patterncrafter.com")
    print("Password: admin123 (Please change this!)")

    client.close()


async def create_sample_data():
    """Create sample data for testing"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]

    users_collection = database.get_collection("users")
    projects_collection = database.get_collection("projects")
    tasks_collection = database.get_collection("tasks")

    # Create sample users
    sample_users = [
        {
            "name": "Manager One",
            "email": "manager1@example.com",
            "role": "manager",
            "paid": False,
            "hashed_password": get_password_hash("password123"),
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Annotator One",
            "email": "annotator1@example.com",
            "role": "annotator",
            "skills": ["NLP", "Text Classification"],
            "hashed_password": get_password_hash("password123"),
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Annotator Two",
            "email": "annotator2@example.com",
            "role": "annotator",
            "skills": ["Computer Vision", "Object Detection"],
            "hashed_password": get_password_hash("password123"),
            "created_at": datetime.utcnow(),
        },
    ]

    # Insert users if they don't exist
    for user in sample_users:
        existing = await users_collection.find_one({"email": user["email"]})
        if not existing:
            result = await users_collection.insert_one(user)
            print(f"Created user: {user['name']} ({user['email']})")

    # Get manager for project creation
    manager = await users_collection.find_one({"email": "manager1@example.com"})
    if manager:
        # Create sample project
        existing_project = await projects_collection.find_one(
            {"manager_id": manager["_id"]}
        )
        if not existing_project:
            project = {
                "manager_id": manager["_id"],
                "details": "Sample text annotation project for sentiment analysis",
                "task_ids": [],
                "created_at": datetime.utcnow(),
            }

            project_result = await projects_collection.insert_one(project)
            print(f"Created project: {project_result.inserted_id}")

            # Create sample tasks
            sample_tasks = [
                "Annotate sentiment for customer reviews",
                "Label named entities in news articles",
                "Tag intent classification for chatbot training",
            ]

            task_ids = []
            for task_desc in sample_tasks:
                task = {
                    "project_id": project_result.inserted_id,
                    "completed_status": {"annotator_part": False, "qa_part": False},
                    "tag_task": task_desc,
                    "created_at": datetime.utcnow(),
                }

                task_result = await tasks_collection.insert_one(task)
                task_ids.append(task_result.inserted_id)
                print(f"Created task: {task_desc}")

            # Update project with task IDs
            await projects_collection.update_one(
                {"_id": project_result.inserted_id}, {"$set": {"task_ids": task_ids}}
            )

    client.close()
    print("Sample data creation completed!")


async def clear_database():
    """Clear all data from the database (use with caution!)"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]

    collections = [
        "users",
        "projects",
        "tasks",
        "invites",
        "manager_projects",
        "project_working",
        "annotator_tasks",
    ]

    confirm = input("Are you sure you want to clear all data? Type 'YES' to confirm: ")
    if confirm == "YES":
        for collection_name in collections:
            collection = database.get_collection(collection_name)
            result = await collection.delete_many({})
            print(f"Deleted {result.deleted_count} documents from {collection_name}")

        print("Database cleared!")
    else:
        print("Operation cancelled.")

    client.close()


async def show_database_stats():
    """Show database statistics"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]

    collections = [
        "users",
        "projects",
        "tasks",
        "invites",
        "manager_projects",
        "project_working",
        "annotator_tasks",
    ]

    print("Database Statistics:")
    print("=" * 50)

    for collection_name in collections:
        collection = database.get_collection(collection_name)
        count = await collection.count_documents({})
        print(f"{collection_name:<20}: {count} documents")

    # Show user role distribution
    users_collection = database.get_collection("users")
    pipeline = [{"$group": {"_id": "$role", "count": {"$sum": 1}}}]
    role_stats = await users_collection.aggregate(pipeline).to_list(None)

    print("\nUser Role Distribution:")
    for stat in role_stats:
        print(f"{stat['_id']:<20}: {stat['count']} users")

    client.close()


async def send_task_assigned_notification(
    annotator_id: ObjectId,
    task_id: ObjectId,
    task_name: str,
    assigner_id: ObjectId,
    project_id: ObjectId,
):
    """Send notification when task is assigned to an annotator"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    notifications_collection = database.get_collection("notifications")

    notification = {
        "recipient_id": annotator_id,
        "sender_id": assigner_id,
        "type": "task_assigned",
        "title": "New Task Assigned",
        "message": f"You have been assigned to task: {task_name}",
        "task_id": task_id,
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }

    await notifications_collection.insert_one(notification)
    client.close()


async def send_invite_notification(
    invitee_id: ObjectId,
    inviter_id: ObjectId,
    project_id: ObjectId,
    project_name: str,
):
    """Send notification when user is invited to a project"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    notifications_collection = database.get_collection("notifications")

    notification = {
        "recipient_id": invitee_id,
        "sender_id": inviter_id,
        "type": "invite",
        "title": "Project Invitation",
        "message": f"You have been invited to project: {project_name}",
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }

    await notifications_collection.insert_one(notification)
    client.close()


async def send_task_completed_notification(
    manager_id: ObjectId,
    task_id: ObjectId,
    task_name: str,
    completed_by_id: ObjectId,
    project_id: ObjectId,
):
    """Send notification when task is completed"""
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    notifications_collection = database.get_collection("notifications")

    notification = {
        "recipient_id": manager_id,
        "sender_id": completed_by_id,
        "type": "task_completed",
        "title": "Task Completed",
        "message": f"Task completed: {task_name}",
        "task_id": task_id,
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }

    await notifications_collection.insert_one(notification)
    client.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python db_utils.py [create_admin|create_sample|clear|stats]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create_admin":
        asyncio.run(create_admin_user())
    elif command == "create_sample":
        asyncio.run(create_sample_data())
    elif command == "clear":
        asyncio.run(clear_database())
    elif command == "stats":
        asyncio.run(show_database_stats())
    else:
        print(
            "Unknown command. Available commands: create_admin, create_sample, clear, stats"
        )
