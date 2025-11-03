# Annotator Task Tracking Implementation

## Overview

This document describes the implementation of the `annotator_tasks` collection for tracking task assignments and completion times for annotators.

## Database Schema

### Collection: `annotator_tasks`

Each document represents a single task assignment to an annotator:

```python
{
    "_id": ObjectId,
    "annotator_id": ObjectId,  # Reference to users collection
    "project_id": ObjectId,    # Reference to projects collection
    "task_id": ObjectId,       # Reference to tasks collection
    "started_at": datetime,    # When the task was assigned
    "completed_at": datetime,  # When the annotation was submitted (null if in progress)
    "completion_time": float   # Time taken in seconds (null if not completed)
}
```

### Indexes Created

- `project_id` - For querying tasks by project
- `annotator_id` - For querying tasks by annotator
- `(task_id, annotator_id)` - Unique compound index to prevent duplicate entries

## Implementation Details

### 1. Task Assignment (PUT /tasks/{task_id}/assign)

When a task is assigned to an annotator:

1. Creates a new entry in `annotator_tasks_collection` with:

   - `annotator_id`: ID of the assigned annotator
   - `project_id`: Project the task belongs to
   - `task_id`: The task being assigned
   - `started_at`: Current timestamp
   - `completed_at`: null
   - `completion_time`: null

2. If the task is being reassigned:
   - Updates the existing entry
   - Resets `started_at` to the new assignment time
   - Resets `completed_at` and `completion_time` to null

**Location:** `backend/routes.py` - Line ~883-927

### 2. Annotation Submission (PUT /tasks/{task_id}/annotation)

When an annotator submits their annotation:

1. Calculates completion time:

   - `completion_time = (completed_at - started_at).total_seconds()`

2. Updates the `annotator_tasks_collection` entry:
   - Sets `completed_at` to current timestamp
   - Sets `completion_time` to calculated seconds

**Location:** `backend/routes.py` - Line ~1032-1049

### 3. Statistics API Endpoints

#### Get Project Annotator Statistics

**Endpoint:** `GET /projects/{project_id}/annotator-stats`
**Access:** Manager of the project or Admin only

Returns aggregated statistics for all annotators in a project:

```json
{
    "project_id": "string",
    "project_name": "string",
    "annotators": [
        {
            "annotator_id": "string",
            "annotator_name": "string",
            "annotator_email": "string",
            "total_tasks_assigned": int,
            "total_tasks_completed": int,
            "total_time_seconds": float,
            "average_time_seconds": float,
            "average_time_formatted": "XmYs",
            "tasks": [
                {
                    "task_id": "string",
                    "started_at": "ISO datetime",
                    "completed_at": "ISO datetime",
                    "completion_time_seconds": float,
                    "completion_time_formatted": "XmYs"
                }
            ]
        }
    ]
}
```

**Location:** `backend/routes.py` - Line ~1285-1357

#### Get My Task History

**Endpoint:** `GET /annotators/my-task-history?project_id={optional}`
**Access:** Annotators only

Returns the current annotator's task history:

```json
{
    "annotator_id": "string",
    "annotator_name": "string",
    "total_tasks": int,
    "completed_tasks": int,
    "history": [
        {
            "task_id": "string",
            "project_id": "string",
            "project_name": "string",
            "task_category": "string",
            "started_at": "ISO datetime",
            "completed_at": "ISO datetime",
            "completion_time_seconds": float,
            "completion_time_formatted": "XmYs",
            "status": "Completed" or "In Progress"
        }
    ]
}
```

**Location:** `backend/routes.py` - Line ~1360-1413

## Usage Examples

### 1. Assigning a Task

```python
PUT /tasks/{task_id}/assign
Body: {
    "annotator_id": "507f1f77bcf86cd799439011"
}
```

This will:

- Assign the task to the annotator
- Create a tracking entry in `annotator_tasks` collection
- Record the start time

### 2. Submitting Annotation

```python
PUT /tasks/{task_id}/annotation
Body: {
    "annotation": {
        "label": "positive",
        "confidence": 0.95
    }
}
```

This will:

- Save the annotation
- Calculate and store the completion time
- Update the tracking entry with completion timestamp

### 3. Viewing Project Statistics

```python
GET /projects/{project_id}/annotator-stats
```

Returns statistics showing:

- How many tasks each annotator completed
- Average time per task for each annotator
- Individual task completion times

### 4. Viewing Personal History

```python
GET /annotators/my-task-history
GET /annotators/my-task-history?project_id={project_id}
```

Returns:

- All tasks assigned to the current annotator
- Completion status and times
- Can be filtered by project

## Benefits

1. **Performance Tracking**: Monitor how long annotators take to complete tasks
2. **Productivity Metrics**: Compare annotator efficiency
3. **Project Planning**: Estimate future task completion times
4. **Quality Insights**: Correlate completion times with annotation quality
5. **Workload Balancing**: Identify overworked or underutilized annotators
6. **Historical Data**: Maintain complete audit trail of task assignments

## Database Migrations

No migration script is needed as the collection will be created automatically when the first document is inserted. Existing tasks will not have historical tracking data, but all new assignments will be tracked.

## Future Enhancements

Potential improvements:

1. Add pause/resume functionality for tasks
2. Track idle time vs. active time
3. Add annotations per hour metric
4. Export statistics to CSV/Excel
5. Dashboard visualizations for managers
6. Automated alerts for tasks taking too long
