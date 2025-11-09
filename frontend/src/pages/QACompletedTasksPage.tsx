import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

const LinkFix = RouterLink as unknown as any;

export default function QACompletedTasksPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    apiFetch<Task[]>(`/projects/${projectId}/my-tasks`)
      .then((allTasks) => {
        // Filter for QA tasks completed
        const qaTasks = allTasks.filter(
          (t) => t.assigned_qa_id === user?.id && t.completed_status?.qa_part
        );
        setTasks(qaTasks);
      })
      .catch((e) => setError(String(e)));
  }, [projectId, user?.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Completed QA Reviews</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks you have reviewed and completed
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
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-medium text-gray-700">
              No completed reviews
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              You haven't completed any QA reviews yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="card hover:shadow-lg transition-shadow border-l-4 border-green-500"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {task.id.slice(0, 8)}
                      </code>
                      <span className="badge badge-primary">
                        {task.category}
                      </span>
                      <span className="badge bg-green-100 text-green-700">
                        ✓ QA Complete
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        QA Completed:{" "}
                        {task.qa_completed_at
                          ? new Date(task.qa_completed_at).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <LinkFix
                    to={`/tasks/${task.id}/view`}
                    className="btn btn-ghost btn-sm"
                  >
                    View Details →
                  </LinkFix>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
