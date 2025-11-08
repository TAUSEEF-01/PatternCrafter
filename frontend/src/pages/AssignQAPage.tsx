import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";

export default function AssignQAPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [qaId, setQaId] = useState("");
  const [qaUsers, setQaUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then(async (t) => {
        setTask(t);
        // Load QA annotators for assignment dropdown
        try {
          const qaList = await apiFetch<
            { id: string; name: string; email: string }[]
          >(`/projects/${t.project_id}/qa-annotators`);
          setQaUsers(qaList);
        } catch (e: any) {
          // don't hard fail UI; show error banner
          setError(
            (prev) => prev || e?.message || "Failed to load QA annotators"
          );
        }
      })
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    try {
      const body: any = {};
      if (qaId) body.qa_id = qaId;
      await apiFetch(`/tasks/${taskId}/assign`, { method: "PUT", body });
      setSuccess("QA reviewer assigned successfully");
    } catch (e: any) {
      setError(e?.message || "Failed to assign QA reviewer");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Assign QA Reviewer</h1>
        <p className="muted mt-1">Assign a QA reviewer to review this task</p>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {task && (
        <div className="card">
          <div className="card-body">
            <h2 className="card-title mb-3">Current Assignment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Task ID:</span>
                <span className="font-mono">{task.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Category:</span>
                <span className="badge badge-primary">{task.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">QA Reviewer:</span>
                <span className="font-medium">
                  {task.assigned_qa_id || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Assign QA Reviewer</h2>
          {qaUsers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-yellow-800 mb-1">
                ⚠️ No QA Reviewers Available
              </p>
              <p className="text-yellow-700">
                You need to designate QA reviewers for this project first. Go to
                the project details page and use the "Manage QA" section to
                assign annotators as QA reviewers.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">QA Reviewer</label>
                <select
                  className="select"
                  value={qaId}
                  onChange={(e) => setQaId(e.target.value)}
                  required
                >
                  <option value="">— Select QA Reviewer —</option>
                  {qaUsers.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name} ({q.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Only annotators designated as QA reviewers for this project
                  are shown
                </p>
              </div>
              <button type="submit" className="btn btn-primary">
                Assign QA Reviewer
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
