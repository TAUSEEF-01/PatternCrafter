"""
API Testing Script for PatternCrafter Backend
This script tests all the main endpoints of the API
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"
TEST_USERS = {
    "admin": {
        "name": "Test Admin",
        "email": "admin@test.com",
        "password": "testpass123",
        "role": "admin",
    },
    "manager": {
        "name": "Test Manager",
        "email": "manager@test.com",
        "password": "testpass123",
        "role": "manager",
    },
    "annotator": {
        "name": "Test Annotator",
        "email": "annotator@test.com",
        "password": "testpass123",
        "role": "annotator",
    },
}


class APITester:
    def __init__(self):
        self.tokens = {}
        self.users = {}
        self.projects = {}
        self.tasks = {}
        self.invites = {}

    def register_user(self, user_data: Dict[str, Any]) -> bool:
        """Register a new user"""
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
            if response.status_code == 200:
                user_info = response.json()
                self.users[user_data["role"]] = user_info
                print(f"✅ Registered {user_data['role']}: {user_data['email']}")
                return True
            else:
                print(f"❌ Failed to register {user_data['role']}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error registering {user_data['role']}: {str(e)}")
            return False

    def login_user(self, email: str, password: str, role: str) -> bool:
        """Login user and store token"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login", json={"email": email, "password": password}
            )
            if response.status_code == 200:
                token_data = response.json()
                self.tokens[role] = token_data["access_token"]
                print(f"✅ Logged in {role}: {email}")
                return True
            else:
                print(f"❌ Failed to login {role}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error logging in {role}: {str(e)}")
            return False

    def get_auth_headers(self, role: str) -> Dict[str, str]:
        """Get authorization headers for a role"""
        return {"Authorization": f"Bearer {self.tokens[role]}"}

    def test_user_info(self, role: str) -> bool:
        """Test getting current user info"""
        try:
            response = requests.get(
                f"{BASE_URL}/auth/me", headers=self.get_auth_headers(role)
            )
            if response.status_code == 200:
                user_info = response.json()
                print(f"✅ Got user info for {role}: {user_info['name']}")
                return True
            else:
                print(f"❌ Failed to get user info for {role}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error getting user info for {role}: {str(e)}")
            return False

    def test_create_project(self) -> bool:
        """Test creating a project (manager only)"""
        try:
            project_data = {"details": "Test project for API testing"}
            response = requests.post(
                f"{BASE_URL}/projects",
                json=project_data,
                headers=self.get_auth_headers("manager"),
            )
            if response.status_code == 200:
                project = response.json()
                self.projects["test_project"] = project
                print(f"✅ Created project: {project['id']}")
                return True
            else:
                print(f"❌ Failed to create project: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating project: {str(e)}")
            return False

    def test_get_projects(self, role: str) -> bool:
        """Test getting projects"""
        try:
            response = requests.get(
                f"{BASE_URL}/projects", headers=self.get_auth_headers(role)
            )
            if response.status_code == 200:
                projects = response.json()
                print(f"✅ Got {len(projects)} projects for {role}")
                return True
            else:
                print(f"❌ Failed to get projects for {role}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error getting projects for {role}: {str(e)}")
            return False

    def test_create_task(self) -> bool:
        """Test creating a task"""
        if not self.projects.get("test_project"):
            print("❌ No test project available for task creation")
            return False

        try:
            task_data = {"tag_task": "Test annotation task"}
            project_id = self.projects["test_project"]["id"]
            response = requests.post(
                f"{BASE_URL}/projects/{project_id}/tasks",
                json=task_data,
                headers=self.get_auth_headers("manager"),
            )
            if response.status_code == 200:
                task = response.json()
                self.tasks["test_task"] = task
                print(f"✅ Created task: {task['id']}")
                return True
            else:
                print(f"❌ Failed to create task: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating task: {str(e)}")
            return False

    def test_create_invite(self) -> bool:
        """Test creating an invite"""
        if not self.projects.get("test_project") or not self.users.get("annotator"):
            print("❌ Missing test project or annotator for invite creation")
            return False

        try:
            invite_data = {"user_id": self.users["annotator"]["id"]}
            project_id = self.projects["test_project"]["id"]
            response = requests.post(
                f"{BASE_URL}/projects/{project_id}/invites",
                json=invite_data,
                headers=self.get_auth_headers("manager"),
            )
            if response.status_code == 200:
                invite = response.json()
                self.invites["test_invite"] = invite
                print(f"✅ Created invite: {invite['id']}")
                return True
            else:
                print(f"❌ Failed to create invite: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating invite: {str(e)}")
            return False

    def test_get_invites(self) -> bool:
        """Test getting invites for annotator"""
        try:
            response = requests.get(
                f"{BASE_URL}/invites", headers=self.get_auth_headers("annotator")
            )
            if response.status_code == 200:
                invites = response.json()
                print(f"✅ Got {len(invites)} invites for annotator")
                return True
            else:
                print(f"❌ Failed to get invites: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error getting invites: {str(e)}")
            return False

    def test_accept_invite(self) -> bool:
        """Test accepting an invite"""
        if not self.invites.get("test_invite"):
            print("❌ No test invite available for acceptance")
            return False

        try:
            invite_id = self.invites["test_invite"]["id"]
            response = requests.put(
                f"{BASE_URL}/invites/{invite_id}/accept",
                headers=self.get_auth_headers("annotator"),
            )
            if response.status_code == 200:
                print(f"✅ Accepted invite: {invite_id}")
                return True
            else:
                print(f"❌ Failed to accept invite: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error accepting invite: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting PatternCrafter API Tests\n")

        # Test server health
        try:
            response = requests.get("http://localhost:8000/health")
            if response.status_code == 200:
                print("✅ Server is healthy")
            else:
                print("❌ Server health check failed")
                return
        except Exception as e:
            print(f"❌ Cannot connect to server: {str(e)}")
            return

        print("\n📝 Testing User Registration...")
        # Register test users
        for role, user_data in TEST_USERS.items():
            self.register_user(user_data)

        print("\n🔐 Testing User Authentication...")
        # Login test users
        for role, user_data in TEST_USERS.items():
            self.login_user(user_data["email"], user_data["password"], role)

        print("\n👤 Testing User Info...")
        # Test getting user info
        for role in TEST_USERS.keys():
            if role in self.tokens:
                self.test_user_info(role)

        print("\n📁 Testing Project Management...")
        # Test project creation
        self.test_create_project()

        # Test getting projects for different roles
        for role in ["manager", "admin", "annotator"]:
            if role in self.tokens:
                self.test_get_projects(role)

        print("\n📋 Testing Task Management...")
        # Test task creation
        self.test_create_task()

        print("\n📧 Testing Invite System...")
        # Test invite creation
        self.test_create_invite()

        # Test getting invites
        self.test_get_invites()

        # Test accepting invite
        self.test_accept_invite()

        print("\n✅ API Testing Completed!")
        print("\n📊 Test Summary:")
        print(f"   Users registered: {len(self.users)}")
        print(f"   Users logged in: {len(self.tokens)}")
        print(f"   Projects created: {len(self.projects)}")
        print(f"   Tasks created: {len(self.tasks)}")
        print(f"   Invites created: {len(self.invites)}")


if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
