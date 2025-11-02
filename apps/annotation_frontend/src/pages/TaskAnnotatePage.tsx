import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Task } from '@/types';
import JsonView from '@/components/JsonView';

export default function TaskAnnotatePage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [annotation, setAnnotation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then(setTask)
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    try {
      const body = { annotation: annotation ? JSON.parse(annotation) : {} };
      await apiFetch(`/tasks/${taskId}/annotation`, { method: 'PUT', body });
      setSuccess('Annotation submitted');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit annotation');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Annotate Task</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      {task && (
        <div className="bg-white p-4 rounded shadow space-y-2">
          <div className="text-sm text-gray-500">Task: {task.id}</div>
          <div className="text-sm text-gray-500">Category: {task.category}</div>
          <div>
            <div className="font-medium mb-1">Task Data</div>
            <JsonView data={task.task_data} />
          </div>
        </div>
      )}

      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <label className="block mb-1">Annotation (JSON)</label>
        <textarea
          className="w-full border rounded p-2 h-40 font-mono"
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          placeholder='{"label":"..."}'
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2">Submit</button>
      </form>
    </div>
  );
}
