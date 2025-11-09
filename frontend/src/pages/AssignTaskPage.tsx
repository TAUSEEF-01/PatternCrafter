import { FormEvent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";

export default function AssignTaskPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [annotatorId, setAnnotatorId] = useState("");
  const [annotators, setAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [availableAnnotators, setAvailableAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then(async (t) => {
        setTask(t);

        // Load project annotators for assignment dropdown
        try {
          const list = await apiFetch<
            { id: string; name: string; email: string }[]
          >(`/projects/${t.project_id}/annotators`);
          setAnnotators(list);

          // Load QA annotators to filter them out
          try {
            const qaList = await apiFetch<
              { id: string; name: string; email: string }[]
            >(`/projects/${t.project_id}/qa-annotators`);

            // Filter out QA annotators from the annotators list
            const qaIds = new Set(qaList.map((qa) => qa.id));
            const filteredAnnotators = list.filter((a) => !qaIds.has(a.id));
            setAvailableAnnotators(filteredAnnotators);
          } catch (e: any) {
            // If QA list fails to load, show all annotators
            console.warn("Failed to load QA annotators:", e);
            setAvailableAnnotators(list);
          }
        } catch (e: any) {
          // don't hard fail UI; show error banner
          setError(
            (prev) => prev || e?.message || "Failed to load project annotators"
          );
        }
      })
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !task) return;
    try {
      const body: any = {};
      if (annotatorId) body.annotator_id = annotatorId;
      await apiFetch(`/tasks/${taskId}/assign`, { method: "PUT", body });
      setSuccess("Annotator assigned successfully");
      // Redirect to project dashboard after 1 second
      setTimeout(() => {
        navigate(`/projects/${task.project_id}`);
      }, 1000);
    } catch (e: any) {
      setError(e?.message || "Failed to assign annotator");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Assign Annotator</h1>
        <p className="muted mt-1">Assign an annotator to work on this task</p>
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
            <h2 className="card-title mb-3">Current Assignments</h2>
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
                <span className="text-gray-600">Annotator:</span>
                <span className="font-medium">
                  {task.assigned_annotator_id || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Assign Annotator</h2>
          {availableAnnotators.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-yellow-800 mb-1">
                ⚠️ No Annotators Available
              </p>
              <p className="text-yellow-700">
                All annotators in this project are designated as QA reviewers.
                You need to invite more annotators or remove some from the QA
                reviewer list.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Annotator</label>
                <select
                  className="select"
                  value={annotatorId}
                  onChange={(e) => setAnnotatorId(e.target.value)}
                  required
                >
                  <option value="">— Select Annotator —</option>
                  {availableAnnotators.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  QA reviewers are excluded from this list
                </p>
              </div>
              <button type="submit" className="btn btn-primary">
                Assign Annotator
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
