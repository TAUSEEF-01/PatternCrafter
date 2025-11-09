import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

const LinkFix = RouterLink as unknown as any;

export default function AnnotatorCompletedTasksPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectAnnotators, setProjectAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  useEffect(() => {
    if (!projectId) return;

    const tasksPath =
      user?.role === "annotator"
        ? `/projects/${projectId}/my-tasks`
        : `/projects/${projectId}/tasks`;

    apiFetch<Task[]>(tasksPath)
      .then((allTasks) => {
        // Filter for tasks completed by annotator
        const completed = allTasks.filter(
          (t) => t.completed_status?.annotator_part
        );
        setTasks(completed);
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

  const handleReturn = async (taskId: string) => {
    if (
      !confirm(
        "Are you sure you want to return this task to the annotator? The annotation will be cleared and they will need to resubmit."
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/tasks/${taskId}/return`, { method: "PUT" });
      // Refresh the page
      window.location.reload();
    } catch (e: any) {
      setError(e?.message || "Failed to return task");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Completed by Annotator</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks that have been completed and are awaiting QA review
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
            <p className="muted text-lg">No completed tasks yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Tasks will appear here once annotators submit their work
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
              onReturn={handleReturn}
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
  onReturn,
}: {
  t: Task;
  isManager: boolean;
  annotators?: { id: string; name: string; email: string }[];
  onReturn?: (taskId: string) => void;
}) {
  const [returning, setReturning] = useState(false);
  const annotatorInfo = annotators.find(
    (a) => a.id === t.assigned_annotator_id
  );
  const qaInfo = annotators.find((a) => a.id === t.assigned_qa_id);

  const handleReturn = async () => {
    setReturning(true);
    if (onReturn) {
      await onReturn(t.id);
    }
    setReturning(false);
  };

  return (
    <div className="card hover:shadow-lg transition-shadow border-l-4 border-green-500">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-lg">
                Task {t.id.slice(0, 8)}
              </div>
              <span className="badge badge-green">Completed</span>
            </div>
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
                <LinkFix
                  className="btn btn-outline btn-sm"
                  to={`/tasks/${t.id}/assign-qa`}
                >
                  Assign QA
                </LinkFix>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={handleReturn}
                  disabled={returning}
                >
                  {returning ? "Returning..." : "Return"}
                </button>
              </>
            )}
            <LinkFix
              className="btn btn-primary btn-sm"
              to={`/tasks/${t.id}/annotate`}
            >
              View
            </LinkFix>
          </div>
        </div>
        <div className="space-y-2">
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              View task data
            </summary>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
              <TaskDataViewer data={t.task_data} />
            </div>
          </details>

          {t.annotation && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-900">
                📝 View annotator's work
              </summary>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
                <TaskDataViewer data={t.annotation} />
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
