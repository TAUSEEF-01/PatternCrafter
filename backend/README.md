# PatternCrafter Backend API

A FastAPI backend for the PatternCrafter application with MongoDB integration.

## Features

- **User Management**: Registration, authentication, and role-based access control
- **Project Management**: Create and manage annotation projects
- **Task Management**: Create and assign tasks within projects
- **Invite System**: Invite users to collaborate on projects
- **Role-based Access**: Admin, Manager, and Annotator roles with different permissions

## Setup

### Prerequisites

- Python 3.8+
- MongoDB (local or cloud instance)
- pip or poetry for package management

### Installation

1. **Clone the repository and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create a virtual environment**

   ```bash
   python -m venv venv

   # On Windows
   venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   Copy the `.env` file and update the values:

   ```bash
   # MongoDB Settings
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=patterncrafter

   # JWT Settings
   SECRET_KEY=your-secret-key-here-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

5. **Start MongoDB**

   Make sure MongoDB is running on your system.

6. **Run the application**

   ```bash
   # Using uvicorn directly
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   # Or using the run script
   python run.py
   ```

## API Documentation

Once the server is running, you can access:

- **API Documentation (Swagger UI)**: http://localhost:8000/docs
- **Alternative API Documentation (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user information

### Users

- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/{user_id}` - Get user by ID

### Projects

- `POST /api/v1/projects` - Create a new project (manager only) with body `{ details, category }`
- `GET /api/v1/projects` - Get projects (filtered by user role)
- `GET /api/v1/projects/{project_id}` - Get project by ID

### Tasks

- `POST /api/v1/projects/{project_id}/tasks` - Create a task in a project. Body: `{ category, task_data, tag_task? }` (task_data varies by category)
- `GET /api/v1/projects/{project_id}/tasks` - Get all tasks for a project
- `GET /api/v1/tasks/{task_id}` - Get task by ID
- `PUT /api/v1/tasks/{task_id}/assign` - Assign annotator/QA. Body: `{ annotator_id?, qa_id? }`
- `PUT /api/v1/tasks/{task_id}/annotation` - Submit annotator annotation. Body: `{ annotation }`
- `PUT /api/v1/tasks/{task_id}/qa` - Submit QA review. Body: `{ qa_annotation, qa_feedback? }`

### Invites

- `POST /api/v1/projects/{project_id}/invites` - Create an invite for a project
- `GET /api/v1/invites` - Get invites for current user
- `PUT /api/v1/invites/{invite_id}/accept` - Accept an invite (sets accepted_at)

## User Roles

### Admin

- Can view all users and projects
- Has access to all endpoints

### Manager

- Can create projects
- Can create tasks within their projects
- Can invite users to their projects
- Can view their own projects and tasks

### Annotator

- Can view projects they're invited to
- Can view tasks for projects they have access to
- Can accept invites

## Database Schema

The application uses MongoDB with the following collections:

- **users**: User accounts with role-based information
- **projects**: Project information managed by managers
- **tasks**: Individual tasks within projects
- **invites**: Project collaboration invites
- **manager_projects**: Manager-project relationships
- **project_working**: Project work assignments
- **annotator_tasks**: Annotator task completion tracking

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Example Usage

### Register a new user

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "password": "securepassword",
       "role": "manager"
     }'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "securepassword"
     }'
```

### Create a project (with JWT token)

```bash
curl -X POST "http://localhost:8000/api/v1/projects" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your_jwt_token>" \
     -d '{
       "details": "My first annotation project"
     }'
```

## Development

### Code Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration settings
├── database.py          # MongoDB connection and setup
├── schemas.py           # Pydantic models and schemas
├── auth.py              # Authentication utilities
├── routes.py            # API route handlers
├── run.py               # Development server script
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
└── README.md           # This file
```

### Adding New Endpoints

1. Define new Pydantic schemas in `schemas.py`
2. Add route handlers in `routes.py`
3. Update database collections in `database.py` if needed

### Testing

You can test the API using:

- The built-in Swagger UI at `/docs`
- Postman or similar API testing tools
- Python requests library
- curl commands

## Production Deployment

For production deployment:

1. **Set a strong SECRET_KEY** in your environment variables
2. **Use a production MongoDB instance**
3. **Configure proper CORS origins**
4. **Use HTTPS** in production
5. **Set up proper logging and monitoring**
6. **Consider using Docker** for containerization

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **Import Errors**: Make sure all dependencies are installed (`pip install -r requirements.txt`)
3. **JWT Token Issues**: Check that SECRET_KEY is set and consistent
4. **CORS Issues**: Update ALLOWED_ORIGINS in your environment variables

### Logs

The application logs important events. Check the console output for debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
