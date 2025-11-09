import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

const LinkFix = RouterLink as unknown as any;

export default function InProgressTasksPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectAnnotators, setProjectAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [unassignTaskModal, setUnassignTaskModal] = useState<{
    taskId: string;
    taskName: string;
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

    const tasksPath =
      user?.role === "annotator"
        ? `/projects/${projectId}/my-tasks`
        : `/projects/${projectId}/tasks`;

    apiFetch<Task[]>(tasksPath)
      .then((allTasks) => {
        // Filter for annotation tasks in progress (not QA tasks)
        const inProgress = allTasks.filter((t) => {
          // For annotators: show only their annotation tasks not completed
          if (user?.role === "annotator") {
            return (
              t.assigned_annotator_id === user?.id &&
              !t.completed_status?.annotator_part
            );
          }
          // For managers: show all annotation tasks not completed
          return !t.completed_status?.annotator_part;
        });
        setTasks(inProgress);
      })
      .catch((e) => setError(String(e)));

    // Load annotators for displaying names
    if (user?.role !== "annotator") {
      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/annotators`
      )
        .then(setProjectAnnotators)
        .catch((e) => console.error("Failed to load annotators:", e));
    }
  }, [projectId, user?.role]);

  const handleUnassignTask = async (taskId: string, taskName: string) => {
    try {
      await apiFetch(`/tasks/${taskId}/unassign`, { method: "PUT" });
      // Refresh tasks
      const tasksPath =
        user?.role === "annotator"
          ? `/projects/${projectId}/my-tasks`
          : `/projects/${projectId}/tasks`;
      const allTasks = await apiFetch<Task[]>(tasksPath);
      const inProgress = allTasks.filter((t) => {
        if (user?.role === "annotator") {
          return (
            t.assigned_annotator_id === user?.id &&
            !t.completed_status?.annotator_part
          );
        }
        return !t.completed_status?.annotator_part;
      });
      setTasks(inProgress);
      setNotification({
        message: "Task unassigned successfully!",
        type: "success",
      });
      setUnassignTaskModal(null);
    } catch (e: any) {
      setNotification({
        message: e?.message || "Failed to unassign task",
        type: "error",
      });
      setUnassignTaskModal(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Unassign Task Confirmation Modal */}
      {unassignTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl border-2 bg-white dark:bg-gray-900 border-orange-300 dark:border-orange-700 p-6 animate-scale-in">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full p-3 bg-orange-100 dark:bg-orange-900/30">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ea580c"
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
            <h3 className="text-2xl font-bold text-center mb-2 text-orange-600 dark:text-orange-400">
              Unassign Task?
            </h3>

            {/* Message */}
            <p className="text-center mb-2 text-gray-700 dark:text-gray-300">
              You're about to unassign task{" "}
              <span className="font-semibold">
                "{unassignTaskModal.taskName}"
              </span>
            </p>
            <p className="text-sm text-center mb-6 text-gray-600 dark:text-gray-400">
              This will remove the assigned annotator and QA reviewer, and clear
              all progress on this task.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setUnassignTaskModal(null)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUnassignTask(
                    unassignTaskModal.taskId,
                    unassignTaskModal.taskName
                  )
                }
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              >
                Unassign Task
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
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
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
            ) : (
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
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold ${
                notification.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
              notification.type === "success"
                ? "hover:bg-green-200 text-green-600"
                : "hover:bg-red-200 text-red-600"
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
          <h1>Tasks In Progress</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks that are currently being worked on
          </p>
        </div>
        <LinkFix className="btn btn-ghost" to={`/projects/${projectId}`}>
          ← Back to Project
        </LinkFix>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="muted text-lg">No tasks in progress</p>
            <p className="text-sm text-gray-500 mt-2">
              All tasks have been completed or no tasks have been assigned yet
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              t={t}
              isManager={user?.role !== "annotator"}
              annotators={projectAnnotators}
              onUnassign={handleUnassignTask}
              onOpenUnassignModal={setUnassignTaskModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskDataViewer({ data }: { data: any }) {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined)
      return <span className="text-gray-400">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      if (value.length === 0)
        return <span className="text-gray-400">Empty</span>;
      if (typeof value[0] === "string") {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div
                key={idx}
                className="text-sm text-gray-700 whitespace-pre-wrap break-words"
              >
                • {item}
              </div>
            ))}
          </div>
        );
      }
      if (typeof value[0] === "object") {
        return (
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  Item {idx + 1}
                </div>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="text-sm mb-1">
                    <span className="font-medium text-gray-600">{k}:</span>{" "}
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return value.join(", ");
    }
    if (typeof value === "object") {
      return (
        <div className="pl-3 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="font-medium text-gray-600">{k}:</span>{" "}
              <span className="text-gray-700">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <span className="text-gray-700 whitespace-pre-wrap break-words">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
        >
          <div className="text-sm font-semibold text-gray-800 mb-1 capitalize">
            {key.replace(/_/g, " ")}
          </div>
          <div className="text-sm">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({
  t,
  isManager,
  annotators = [],
  onUnassign,
  onOpenUnassignModal,
}: {
  t: Task;
  isManager: boolean;
  annotators?: { id: string; name: string; email: string }[];
  onUnassign?: (taskId: string, taskName: string) => void;
  onOpenUnassignModal?: (data: { taskId: string; taskName: string }) => void;
}) {
  const annotatorInfo = annotators.find(
    (a) => a.id === t.assigned_annotator_id
  );
  const qaInfo = annotators.find((a) => a.id === t.assigned_qa_id);

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-lg">Task {t.id.slice(0, 8)}</div>
            <span className="badge mt-1">{t.category}</span>
            {t.assigned_annotator_id && (
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Annotator:</span>{" "}
                {annotatorInfo?.name || t.assigned_annotator_id}
                {annotatorInfo?.email && (
                  <span className="text-gray-500">
                    {" "}
                    ({annotatorInfo.email})
                  </span>
                )}
              </div>
            )}
            {t.assigned_qa_id && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">QA:</span>{" "}
                {qaInfo?.name || t.assigned_qa_id}
                {qaInfo?.email && (
                  <span className="text-gray-500"> ({qaInfo.email})</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isManager && (
              <>
                <LinkFix
                  className="btn btn-outline btn-sm"
                  to={`/tasks/${t.id}/assign`}
                >
                  Assign
                </LinkFix>
                {(t.assigned_annotator_id || t.assigned_qa_id) &&
                  onOpenUnassignModal && (
                    <button
                      onClick={() =>
                        onOpenUnassignModal({
                          taskId: t.id,
                          taskName: `Task ${t.id.slice(0, 8)}`,
                        })
                      }
                      className="btn btn-outline btn-sm text-orange-600 hover:bg-orange-50 border-orange-600"
                      title="Unassign this task"
                    >
                      ↩️ Unassign
                    </button>
                  )}
              </>
            )}
            <LinkFix
              className="btn btn-primary btn-sm"
              to={`/tasks/${t.id}/annotate`}
            >
              Annotate
            </LinkFix>
          </div>
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            View task data
          </summary>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
            <TaskDataViewer data={t.task_data} />
          </div>
        </details>
      </div>
    </div>
  );
}
