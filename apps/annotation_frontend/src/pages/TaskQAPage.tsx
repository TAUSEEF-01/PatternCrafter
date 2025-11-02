import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Task } from '@/types';
import JsonView from '@/components/JsonView';

export default function TaskQAPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [qa, setQa] = useState('');
  const [feedback, setFeedback] = useState('');
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
      const body = { qa_annotation: qa ? JSON.parse(qa) : {}, qa_feedback: feedback || undefined };
      await apiFetch(`/tasks/${taskId}/qa`, { method: 'PUT', body });
      setSuccess('QA submitted');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit QA');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">QA Task</h1>
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
          {task.annotation && (
            <div>
              <div className="font-medium mb-1">Annotator Annotation</div>
              <JsonView data={task.annotation} />
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <label className="block mb-1">QA Annotation (JSON)</label>
        <textarea
          className="w-full border rounded p-2 h-40 font-mono"
          value={qa}
          onChange={(e) => setQa(e.target.value)}
          placeholder='{"decision":"approve"}'
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Feedback (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2">Submit QA</button>
      </form>
    </div>
  );
}
