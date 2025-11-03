# PatternCrafter

A comprehensive data annotation platform for AI/ML projects, enabling collaborative annotation workflows with role-based access control, task management, and quality assurance features.

## 🌟 Overview

PatternCrafter is a full-stack web application designed to streamline the data annotation process for machine learning projects. It supports multiple annotation categories including image classification, text classification, object detection, NER, sentiment analysis, and generative AI evaluation tasks.

## ✨ Key Features

### For Managers

- **Project Management**: Create and manage annotation projects with custom categories
- **Task Creation**: Generate tasks for various ML categories (image classification, NER, object detection, etc.)
- **Team Collaboration**: Invite annotators and QA reviewers to projects
- **Task Assignment**: Assign specific tasks to annotators and QA reviewers
- **Progress Tracking**: Monitor task completion and quality assurance status
- **Completed Tasks View**: Review all completed and QA-approved tasks

### For Annotators

- **Task Dashboard**: View assigned annotation tasks
- **Flexible Annotation**: Support for multiple annotation formats based on task category
- **Invitation Management**: Accept project invitations
- **Task Tracking**: Monitor personal task completion progress

### For QA Reviewers

- **Quality Assurance**: Review annotator submissions
- **Feedback System**: Provide feedback on annotations
- **Approval Workflow**: Approve or request revisions on annotations

### Supported Annotation Categories

- 📸 **Image Classification**
- 📝 **Text Classification**
- 🎯 **Object Detection**
- 🏷️ **Named Entity Recognition (NER)**
- 💭 **Sentiment Analysis**
- 🤖 **Generative AI LLM Response Grading**
- 💬 **Generative AI Chatbot Assessment**
- 🗨️ **Conversational AI Response Selection**
- 📄 **Text Summarization**
- ❓ **Q&A Evaluation**

## 🏗️ Architecture

The project follows a monorepo structure with separate frontend and backend applications:

```
PatternCrafter/
├── apps/
│   └── annotation_frontend/    # React + TypeScript + Vite frontend
├── backend/                     # FastAPI + MongoDB backend
└── README.md                    # This file
```

### Tech Stack

#### Frontend

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Fetch API

#### Backend

- **Framework**: FastAPI
- **Language**: Python 3.8+
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Passlib with Bcrypt
- **Database Driver**: Motor (async MongoDB driver)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **MongoDB** (local or cloud instance)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/TAUSEEF-01/PatternCrafter.git
cd PatternCrafter
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt)
.\venv\Scripts\activate.bat
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file with the following content:
```

Create `backend/.env` file:

```env
# MongoDB Settings
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=patterncrafter

# JWT Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:5176,http://localhost:3000
```

```bash
# Start the backend server
python main.py
```

The backend API will be available at `http://localhost:8000`

#### 3. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd apps/annotation_frontend

# Install dependencies
npm install

# (Optional) Configure API endpoint
# Create .env.development file:
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.development

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5176`

### First Time Setup

1. **Start MongoDB** - Ensure MongoDB is running on your system
2. **Start Backend** - Run the FastAPI server (port 8000)
3. **Start Frontend** - Run the Vite dev server (port 5176)
4. **Register** - Create your first user account (choose "Manager" role to create projects)
5. **Create Project** - Login and create your first annotation project
6. **Start Annotating** - Create tasks and invite team members!

## 📖 Usage Guide

### User Roles

#### Admin

- Full system access
- Can view all users and projects
- System administration capabilities

#### Manager

- Create and manage annotation projects
- Create tasks within projects
- Invite annotators and QA reviewers
- Assign tasks to team members
- Review completed tasks

#### Annotator

- View assigned tasks
- Submit annotations
- Accept project invitations
- Track personal progress

### Workflow

1. **Manager creates a project** with specific annotation requirements
2. **Manager creates tasks** for the project (e.g., images to classify, text to annotate)
3. **Manager invites annotators** to the project
4. **Annotators accept invitations** and can view their tasks
5. **Manager assigns tasks** to specific annotators (and optionally QA reviewers)
6. **Annotators complete tasks** by submitting annotations
7. **QA reviewers review** annotations and provide feedback
8. **Manager monitors progress** and views completed tasks

## 🔌 API Documentation

Once the backend is running, you can access comprehensive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Key API Endpoints

#### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

#### Projects

- `POST /api/v1/projects` - Create project (Manager only)
- `GET /api/v1/projects` - List projects (filtered by role)
- `GET /api/v1/projects/{project_id}` - Get project details

#### Tasks

- `POST /api/v1/projects/{project_id}/tasks` - Create task
- `GET /api/v1/projects/{project_id}/tasks` - List project tasks
- `PUT /api/v1/tasks/{task_id}/assign` - Assign task
- `PUT /api/v1/tasks/{task_id}/annotation` - Submit annotation
- `PUT /api/v1/tasks/{task_id}/qa` - Submit QA review

#### Invites

- `POST /api/v1/projects/{project_id}/invites` - Invite user
- `GET /api/v1/invites` - Get user invitations
- `PUT /api/v1/invites/{invite_id}/accept` - Accept invitation

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Role-Based Access Control (RBAC)**: Different permissions for each user role
- **CORS Protection**: Configured allowed origins
- **Environment Variables**: Sensitive data stored in `.env` files

## 🛠️ Development

### Backend Development

```bash
cd backend
python main.py  # Runs with auto-reload enabled
```

### Frontend Development

```bash
cd apps/annotation_frontend
npm run dev  # Runs with hot module replacement
```

### Building for Production

#### Frontend Build

```bash
cd apps/annotation_frontend
npm run build  # Creates optimized production build in dist/
npm run preview  # Preview production build locally
```

#### Backend Deployment

For production, use a production-grade ASGI server:

```bash
# Using uvicorn with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Deployment (Optional)

The backend includes a `docker-compose.yml` for MongoDB setup:

```bash
cd backend
docker-compose up -d
```

## 📁 Project Structure

```
PatternCrafter/
├── apps/
│   └── annotation_frontend/
│       ├── src/
│       │   ├── api/          # API client utilities
│       │   ├── auth/         # Authentication context
│       │   ├── components/   # Reusable components
│       │   ├── pages/        # Page components
│       │   ├── types.ts      # TypeScript type definitions
│       │   ├── App.tsx       # Main app component
│       │   └── main.tsx      # Entry point
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.cjs
│
├── backend/
│   ├── main.py              # FastAPI application
│   ├── routes.py            # API route handlers
│   ├── schemas.py           # Pydantic models
│   ├── database.py          # MongoDB connection
│   ├── auth.py              # JWT authentication
│   ├── config.py            # Configuration
│   ├── requirements.txt     # Python dependencies
│   ├── docker-compose.yml   # MongoDB Docker setup
│   └── README.md
│
└── README.md                # This file
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
python test_api.py  # Run API tests
```

### Frontend Testing

Use the browser console and network tab to debug frontend issues. The application includes comprehensive error handling and user feedback.

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start

- **MongoDB connection error**: Ensure MongoDB is running
- **Port already in use**: Change the port in `main.py` or kill the process using port 8000
- **Import errors**: Reinstall dependencies with `pip install -r requirements.txt`

#### Frontend won't start

- **Vite not found**: Run `npm install` in the frontend directory
- **Port already in use**: Change the port in `vite.config.ts` or use `--port` flag
- **API connection error**: Verify backend is running and CORS is configured

#### Authentication issues

- **JWT token expired**: Login again to get a new token
- **Invalid credentials**: Verify email and password
- **CORS error**: Check `ALLOWED_ORIGINS` in backend `.env`

### Debug Mode

Enable verbose logging in backend:

```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Backend**: Follow PEP 8 style guide
- **Frontend**: Follow Airbnb JavaScript/React style guide
- Use meaningful variable and function names
- Add comments for complex logic
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **TAUSEEF-01** - _Initial work_ - [GitHub](https://github.com/TAUSEEF-01)

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- React team for the powerful UI library
- MongoDB for the flexible NoSQL database
- Tailwind CSS for the utility-first CSS framework
- Vite for the blazing fast build tool

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Backend README](backend/README.md) for backend-specific documentation
2. Check the [Frontend README](apps/annotation_frontend/README.md) for frontend-specific documentation
3. Open an issue on GitHub
4. Contact the maintainers

## 🗺️ Roadmap

Future enhancements planned:

- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Export annotations to popular ML formats (COCO, Pascal VOC, etc.)
- [ ] Batch task creation from datasets
- [ ] Inter-annotator agreement metrics
- [ ] Custom annotation templates
- [ ] Integration with popular ML frameworks
- [ ] Mobile app for on-the-go annotation
- [ ] Advanced image annotation tools (bounding boxes, polygons, etc.)
- [ ] Audio and video annotation support

## 📊 Database Schema

### Collections

- **users**: User accounts with role information
- **projects**: Annotation projects
- **tasks**: Individual annotation tasks
- **invites**: Project collaboration invitations
- **manager_projects**: Manager-project relationships
- **project_working**: Project access tracking
- **annotator_tasks**: Task completion tracking

---

**Built with ❤️ for the ML/AI annotation community**
