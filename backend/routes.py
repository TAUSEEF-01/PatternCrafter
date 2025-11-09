"""Main router that combines all route modules"""

from fastapi import APIRouter

# Import all route modules
import auth_routes
import user_routes
import project_routes
import task_routes
import invite_routes
import notification_routes

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(auth_routes.router, tags=["Authentication"])
router.include_router(user_routes.router, tags=["Users"])
router.include_router(project_routes.router, tags=["Projects"])
router.include_router(task_routes.router, tags=["Tasks"])
router.include_router(invite_routes.router, tags=["Invites"])
router.include_router(notification_routes.router, tags=["Notifications"])
