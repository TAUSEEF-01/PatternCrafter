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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Assign Task</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}

      {task && (
        <div className="bg-white p-4 rounded shadow space-y-2">
          <div className="text-sm text-gray-500">Task: {task.id}</div>
          <div className="text-sm text-gray-500">Category: {task.category}</div>
          <div className="text-sm">Annotator: {task.assigned_annotator_id || '—'}</div>
          <div className="text-sm">QA: {task.assigned_qa_id || '—'}</div>
        </div>
      )}

      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <div>
          <label className="block text-sm mb-1">Annotator</label>
          <select
            className="w-full border rounded px-3 py-2"
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
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="QA User ID"
          value={qaId}
          onChange={(e) => setQaId(e.target.value)}
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2">Save</button>
      </form>
    </div>
  );
}
