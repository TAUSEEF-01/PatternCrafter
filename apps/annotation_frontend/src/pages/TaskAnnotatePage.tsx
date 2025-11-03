import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Task } from '@/types';

function TaskDataViewer({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400">—</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">Empty</span>;
      if (typeof value[0] === 'string') {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div key={idx} className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                • {item}
              </div>
            ))}
          </div>
        );
      }
      if (typeof value[0] === 'object') {
        return (
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">Item {idx + 1}</div>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="text-sm mb-1">
                    <span className="font-medium text-gray-600">{k}:</span>{' '}
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return (
        <div className="pl-3 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="font-medium text-gray-600">{k}:</span>{' '}
              <span className="text-gray-700">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-700 whitespace-pre-wrap break-words">{String(value)}</span>;
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
          <div className="text-sm font-semibold text-gray-800 mb-1 capitalize">
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-sm">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto scrollbar-thin">
                <TaskDataViewer data={task.task_data} />
              </div>
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
