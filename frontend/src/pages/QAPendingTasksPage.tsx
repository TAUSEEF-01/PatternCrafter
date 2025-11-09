import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

const LinkFix = RouterLink as unknown as any;

export default function QAPendingTasksPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    apiFetch<Task[]>(`/projects/${projectId}/my-tasks`)
      .then((allTasks) => {
        // Filter for QA tasks pending review (annotation done, QA not done)
        const qaTasks = allTasks.filter(
          (t) =>
            t.assigned_qa_id === user?.id &&
            t.completed_status?.annotator_part &&
            !t.completed_status?.qa_part
        );
        setTasks(qaTasks);
      })
      .catch((e) => setError(String(e)));
  }, [projectId, user?.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Pending QA Reviews</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks assigned to you for quality assurance review
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
            <h3 className="text-lg font-medium text-gray-700">
              No tasks pending review
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              All your QA reviews are complete or no tasks have been assigned
              for review yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="card hover:shadow-lg transition-shadow border-l-4 border-purple-500"
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
                      <span className="badge bg-purple-100 text-purple-700">
                        🔍 QA Review
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        Annotated:{" "}
                        {task.annotator_completed_at
                          ? new Date(
                              task.annotator_completed_at
                            ).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <LinkFix
                    to={`/tasks/${task.id}/qa`}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Review Task →
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
