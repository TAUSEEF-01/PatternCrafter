import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Task } from '@/types';

export default function AssignTaskPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [annotatorId, setAnnotatorId] = useState('');
  const [annotators, setAnnotators] = useState<{ id: string; name: string; email: string }[]>([]);
  const [qaId, setQaId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then(async (t) => {
        setTask(t);
        // Load project annotators for assignment dropdown
        try {
          const list = await apiFetch<{ id: string; name: string; email: string }[]>(
            `/projects/${t.project_id}/annotators`
          );
          setAnnotators(list);
        } catch (e: any) {
          // don't hard fail UI; show error banner
          setError((prev) => prev || e?.message || 'Failed to load project annotators');
        }
      })
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    try {
      const body: any = {};
      if (annotatorId) body.annotator_id = annotatorId;
      if (qaId) body.qa_id = qaId;
      await apiFetch(`/tasks/${taskId}/assign`, { method: 'PUT', body });
      setSuccess('Assignment updated');
    } catch (e: any) {
      setError(e?.message || 'Failed to assign');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Assign Task</h1>
        <p className="muted mt-1">Assign annotators and QA reviewers to this task</p>
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
                <span className="font-medium">{task.assigned_annotator_id || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">QA:</span>
                <span className="font-medium">{task.assigned_qa_id || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Update Assignment</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Annotator</label>
              <select
                className="select"
                value={annotatorId}
                onChange={(e) => setAnnotatorId(e.target.value)}
              >
                <option value="">— Select Annotator —</option>
                {annotators.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">QA User ID</label>
              <input
                className="input"
                placeholder="Enter QA user ID"
                value={qaId}
                onChange={(e) => setQaId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save Assignment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
