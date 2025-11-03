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
    <div className="space-y-6">
      <div>
        <h1>Annotate Task</h1>
        <p className="muted mt-1">Review the task data and provide your annotation</p>
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
          <div className="card-body space-y-4">
            <div>
              <h2 className="card-title mb-2">Task Information</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-gray-600">{task.id.slice(0, 8)}</span>
                <span className="badge badge-primary">{task.category}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Task Data</h3>
              <JsonView data={task.task_data} />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Submit Annotation</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Annotation (JSON format)</label>
              <textarea
                className="textarea font-mono text-sm h-48"
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
                placeholder='{"label": "example", "confidence": 0.95}'
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Submit Annotation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
