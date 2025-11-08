import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Project, Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

// Temporary workaround for react-router-dom Link typing mismatch across the file
const LinkFix = RouterLink as unknown as any;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // QA Management
  const [projectAnnotators, setProjectAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [qaAnnotators, setQaAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  // Delete task functionality
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deleteTaskModal, setDeleteTaskModal] = useState<{
    taskId: string;
    taskName: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!projectId) return;
    apiFetch<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch((e) => setError(String(e)));
    const tasksPath =
      user?.role === "annotator"
        ? `/projects/${projectId}/my-tasks`
        : `/projects/${projectId}/tasks`;
    apiFetch<Task[]>(tasksPath)
      .then(setTasks)
      .catch((e) => setError(String(e)));

    // Load annotators and QA annotators for managers
    if (user?.role !== "annotator") {
      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/annotators`
      )
        .then(setProjectAnnotators)
        .catch((e) => console.error("Failed to load annotators:", e));

      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/qa-annotators`
      )
        .then(setQaAnnotators)
        .catch((e) => console.error("Failed to load QA annotators:", e));
    }
  }, [projectId, user?.role]);

  // Task statistics
  const taskStats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => !t.completed_status?.annotator_part).length,
    completed: tasks.filter((t) => t.completed_status?.annotator_part).length,
    returned: tasks.filter((t) => t.is_returned).length,
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setNotification({
        message: "Task deleted successfully!",
        type: "success",
      });
      setDeleteTaskModal(null);
    } catch (e: any) {
      setNotification({
        message: e?.message || "Failed to delete task",
        type: "error",
      });
    } finally {
      setDeletingTaskId(null);
    }
  };

  const getTaskStatus = (task: Task) => {
    if (task.is_returned) {
      return { label: "Returned", color: "amber" };
    }
    if (task.completed_status?.qa_part) {
      return { label: "Completed", color: "green" };
    }
    if (task.completed_status?.annotator_part) {
      return { label: "Awaiting QA", color: "blue" };
    }
    if (task.assigned_annotator_id) {
      return { label: "In Progress", color: "yellow" };
    }
    return { label: "Unassigned", color: "gray" };
  };

  return (
    <div className="space-y-6">
      {/* Delete Task Confirmation Modal */}
      {deleteTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl border-2 bg-white dark:bg-gray-900 border-red-300 dark:border-red-700 p-6 animate-scale-in">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full p-3 bg-red-100 dark:bg-red-900/30">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-2 text-red-600 dark:text-red-400">
              Delete Task?
            </h3>

            {/* Message */}
            <p className="text-center mb-2 text-gray-700 dark:text-gray-300">
              You're about to delete task{" "}
              <span className="font-semibold">
                "{deleteTaskModal.taskName}"
              </span>
            </p>
            <p className="text-sm text-center mb-6 text-gray-600 dark:text-gray-400">
              This action cannot be undone. All task data will be permanently
              removed.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTaskModal(null)}
                disabled={deletingTaskId === deleteTaskModal.taskId}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteTaskModal.taskId)}
                disabled={deletingTaskId === deleteTaskModal.taskId}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg ${
                  deletingTaskId === deleteTaskModal.taskId
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                }`}
              >
                {deletingTaskId === deleteTaskModal.taskId ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 max-w-md animate-slide-in-right shadow-2xl rounded-xl border-2 p-4 flex items-start gap-3 ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-900/90 border-green-300 dark:border-green-700 backdrop-blur-sm"
              : notification.type === "error"
              ? "bg-red-50 dark:bg-red-900/90 border-red-300 dark:border-red-700 backdrop-blur-sm"
              : "bg-blue-50 dark:bg-blue-900/90 border-blue-300 dark:border-blue-700 backdrop-blur-sm"
          }`}
        >
          <div className="flex-shrink-0">
            {notification.type === "success" ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : notification.type === "error" ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold ${
                notification.type === "success"
                  ? "text-green-800 dark:text-green-400"
                  : notification.type === "error"
                  ? "text-red-800 dark:text-red-400"
                  : "text-blue-800 dark:text-blue-400"
              }`}
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
              notification.type === "success"
                ? "hover:bg-green-200 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400"
                : notification.type === "error"
                ? "hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400"
                : "hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1>{project?.details || "Project Details"}</h1>
          {project && (
            <div className="muted mt-1">
              <span className="badge badge-primary">{project.category}</span>
            </div>
          )}
        </div>
        <LinkFix className="btn btn-ghost" to="/projects">
          ← Back to Projects
        </LinkFix>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-blue-600">
              {taskStats.total}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {taskStats.inProgress}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-green-600">
              {taskStats.completed}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </div>
        {taskStats.returned > 0 && (
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-amber-600">
                {taskStats.returned}
              </div>
              <div className="text-sm text-gray-600 mt-1">Returned</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Cards */}
      {user?.role === "annotator" ? (
        // Annotator View
        <div className="grid md:grid-cols-2 gap-4">
          {taskStats.returned > 0 && (
            <LinkFix
              to={`/projects/${projectId}/tasks/returned`}
              className="card hover:shadow-xl transition-shadow border-l-4 border-amber-500"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700">
                      ⚠️ Tasks Needing Revision
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {taskStats.returned} task(s) returned for rework
                    </p>
                  </div>
                  <div className="text-3xl">→</div>
                </div>
              </div>
            </LinkFix>
          )}

          <LinkFix
            to={`/projects/${projectId}/tasks/in-progress`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-blue-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Your Assigned Tasks</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {
                      tasks.filter(
                        (t) =>
                          !t.is_returned && !t.completed_status?.annotator_part
                      ).length
                    }{" "}
                    task(s) ready to work on
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/tasks/completed`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-green-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Your Completed Tasks
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {
                      tasks.filter(
                        (t) =>
                          t.completed_status?.annotator_part && !t.is_returned
                      ).length
                    }{" "}
                    task(s) submitted for review
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>
        </div>
      ) : (
        // Manager View
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LinkFix
            to={`/projects/${projectId}/tasks/create`}
            state={{ category: project?.category }}
            className="card hover:shadow-xl transition-shadow border-l-4 border-purple-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">➕ Create Task</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a new task to this project
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/tasks/in-progress`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-yellow-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    ⏳ Tasks In Progress
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {taskStats.inProgress} task(s) being worked on
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/tasks/annotator-completed`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-green-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    ✅ Completed by Annotator
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {taskStats.completed} task(s) awaiting review
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/completed`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-blue-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">🎯 Fully Completed</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View all finished tasks
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/roles`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-indigo-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">👥 Manage Roles</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Assign annotators and QA reviewers
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>
        </div>
      )}

      {/* Team Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Annotators */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-3">
              👤 Annotators ({projectAnnotators.length})
            </h3>
            {projectAnnotators.length === 0 ? (
              <p className="text-sm text-gray-500">No annotators yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-auto">
                {projectAnnotators.map((annotator) => (
                  <div
                    key={annotator.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {annotator.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {annotator.email}
                      </div>
                    </div>
                    {qaAnnotators.some((qa) => qa.id === annotator.id) && (
                      <div className="badge badge-primary badge-sm">QA</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QA Reviewers */}
        {user?.role !== "annotator" && (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  🔍 QA Reviewers ({qaAnnotators.length})
                </h3>
                <LinkFix
                  to={`/projects/${projectId}/roles`}
                  className="btn btn-outline btn-sm"
                >
                  Manage
                </LinkFix>
              </div>
              {qaAnnotators.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No QA reviewers assigned yet
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {qaAnnotators.map((qa) => (
                    <div
                      key={qa.id}
                      className="flex items-center gap-2 p-2 bg-green-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{qa.name}</div>
                        <div className="text-xs text-gray-500">{qa.email}</div>
                      </div>
                      <div className="badge badge-green badge-sm">QA</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* All Tasks Section - Manager Only */}
      {user?.role !== "annotator" && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                📋 All Tasks ({tasks.length})
              </h3>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="mx-auto"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-gray-500">No tasks created yet</p>
                <LinkFix
                  to={`/projects/${projectId}/tasks/create`}
                  className="btn btn-primary btn-sm mt-3"
                >
                  Create First Task
                </LinkFix>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>QA Reviewer</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const status = getTaskStatus(task);
                      const assignedAnnotator = projectAnnotators.find(
                        (a) => a.id === task.assigned_annotator_id
                      );
                      const assignedQA = qaAnnotators.find(
                        (q) => q.id === task.assigned_qa_id
                      );

                      return (
                        <tr key={task.id}>
                          <td>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {task.id.slice(0, 8)}...
                            </code>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                status.color === "green"
                                  ? "badge-green"
                                  : status.color === "blue"
                                  ? "badge-primary"
                                  : status.color === "yellow"
                                  ? "badge-yellow"
                                  : status.color === "amber"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td>
                            {assignedAnnotator ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {assignedAnnotator.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assignedAnnotator.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td>
                            {assignedQA ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {assignedQA.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assignedQA.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-sm text-gray-600">
                              {task.created_at
                                ? new Date(task.created_at).toLocaleDateString()
                                : "-"}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <LinkFix
                                to={`/tasks/${task.id}/view`}
                                className="btn btn-ghost btn-sm"
                              >
                                👁️ View
                              </LinkFix>
                              <button
                                onClick={() =>
                                  setDeleteTaskModal({
                                    taskId: task.id,
                                    taskName: `Task ${task.id.slice(0, 8)}`,
                                  })
                                }
                                disabled={deletingTaskId === task.id}
                                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
