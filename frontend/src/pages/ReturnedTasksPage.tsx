import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

const LinkFix = RouterLink as unknown as any;

export default function ReturnedTasksPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const tasksPath = `/projects/${projectId}/my-tasks`;

    apiFetch<Task[]>(tasksPath)
      .then((allTasks) => {
        // Filter for returned tasks assigned to this annotator
        const returned = allTasks.filter((t) => {
          return (
            t.assigned_annotator_id === user?.id &&
            t.is_returned === true &&
            !t.completed_status?.annotator_part
          );
        });
        setTasks(returned);
      })
      .catch((e) => setError(String(e)));
  }, [projectId, user?.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>📥 Returned Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks that have been returned for revision
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
            <div className="text-4xl mb-3">✅</div>
            <p className="muted text-lg">No returned tasks</p>
            <p className="text-sm text-gray-500 mt-2">
              All your tasks are either in progress or have been approved
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ t }: { t: Task }) {
  return (
    <div className="card hover:shadow-lg transition-shadow border-l-4 border-amber-500">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {t.id.slice(0, 8)}
              </code>
              <span className="badge badge-primary">{t.category}</span>
              <span className="badge bg-amber-100 text-amber-700">
                ↩️ Returned
              </span>
            </div>

            {/* Return Reason */}
            {t.return_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                <div className="flex items-start gap-2">
                  <div className="text-amber-600 mt-0.5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-amber-800 mb-1">
                      Reason for Return:
                    </div>
                    <div className="text-sm text-amber-700 whitespace-pre-wrap">
                      {t.return_reason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {t.accumulated_time && (
              <div className="text-sm text-gray-600 mt-2">
                Previous time spent: {Math.round(t.accumulated_time / 60)}{" "}
                minutes
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <LinkFix
              to={`/tasks/${t.id}/view`}
              className="btn btn-ghost btn-sm"
            >
              👁️ View
            </LinkFix>
            <LinkFix
              to={`/tasks/${t.id}/annotate`}
              className="btn btn-primary btn-sm"
            >
              Revise →
            </LinkFix>
          </div>
        </div>
      </div>
    </div>
  );
}
