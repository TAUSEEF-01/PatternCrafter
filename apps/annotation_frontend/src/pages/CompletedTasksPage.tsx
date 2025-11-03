import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Project, Task } from '@/types';
import { useAuth } from '@/auth/AuthContext';

export default function CompletedTasksPage() {
  // Temporary workaround for react-router-dom Link typing mismatch in this workspace
  const Link = RouterLink as unknown as any;
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const annotatorId = searchParams.get('annotator_id') || '';

  const canView = useMemo(() => user && user.role !== 'annotator', [user]);

  useEffect(() => {
    if (!projectId || !canView) return;
    setError(null);
    apiFetch<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch((e) => setError(String(e)));
  }, [projectId, canView]);

  const loadTasks = async () => {
    if (!projectId || !canView) return;
    try {
      setLoading(true);
      setError(null);
      const q = annotatorId ? `?annotator_id=${encodeURIComponent(annotatorId)}` : '';
      const list = await apiFetch<Task[]>(`/projects/${projectId}/completed-tasks${q}`);
      setTasks(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load completed tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, annotatorId, canView]);

  const updateAnnotatorId = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('annotator_id', val);
    else next.delete('annotator_id');
    setSearchParams(next);
  };

  const download = async (format: 'csv' | 'json') => {
    if (!projectId) return;
    try {
      const qParts = [`format=${format}`];
      if (annotatorId) qParts.push(`annotator_id=${encodeURIComponent(annotatorId)}`);
      const query = qParts.length ? `?${qParts.join('&')}` : '';
      const data = await apiFetch<string>(`/projects/${projectId}/completed-tasks/export${query}`);
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `completed_tasks_${projectId}.${format}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (e: any) {
      setError(e?.message || `Failed to download ${format.toUpperCase()}`);
    }
  };

  if (!canView) return <div className="p-6">Not authorized</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Completed Tasks</h1>
          {project && (
            <div className="text-gray-600 text-sm space-y-1">
              <div>Project: {project.details}</div>
              <div>Category: {project.category}</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {projectId && (
            <Link className="text-blue-600 hover:underline" to={`/projects/${projectId}`}>
              Back to Project
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow flex items-end gap-3">
        <div>
          <label className="block text-sm mb-1">Filter by Annotator ID</label>
          <input
            className="border rounded px-2 py-1 w-80"
            placeholder="annotator user id (optional)"
            value={annotatorId}
            onChange={(e) => updateAnnotatorId(e.target.value)}
          />
        </div>
        <button className="px-3 py-2 border rounded" onClick={() => loadTasks()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <div className="flex-1" />
        <button className="px-3 py-2 border rounded" onClick={() => download('csv')}>
          Download CSV
        </button>
        <button className="px-3 py-2 border rounded" onClick={() => download('json')}>
          Download JSON
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid gap-3">
        {tasks.length === 0 && !loading && (
          <div className="text-gray-600">No completed tasks found.</div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Task {t.id.slice(0, 8)}</div>
                <div className="text-sm text-gray-600">Category: {t.category}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Annotator: {t.assigned_annotator_id || '—'} | QA: {t.assigned_qa_id || '—'}
                </div>
                <div className="text-xs text-gray-600">
                  Annotator Completed: {t.annotator_completed_at || '—'} | QA Completed:{' '}
                  {t.qa_completed_at || '—'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link className="text-blue-600 hover:underline" to={`/tasks/${t.id}/qa`}>
                  View QA
                </Link>
                <Link className="text-blue-600 hover:underline" to={`/tasks/${t.id}/annotate`}>
                  View Annotation
                </Link>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-700">Task Data</summary>
              <pre className="bg-gray-50 p-2 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(t.task_data, null, 2)}
              </pre>
            </details>
            {t.annotation && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-gray-700">Annotation</summary>
                <pre className="bg-gray-50 p-2 rounded mt-2 text-sm overflow-auto">
                  {JSON.stringify(t.annotation, null, 2)}
                </pre>
              </details>
            )}
            {t.qa_annotation && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-gray-700">QA Annotation</summary>
                <pre className="bg-gray-50 p-2 rounded mt-2 text-sm overflow-auto">
                  {JSON.stringify(t.qa_annotation, null, 2)}
                </pre>
              </details>
            )}
            {t.qa_feedback && (
              <div className="mt-3 text-sm">
                <span className="font-medium">QA Feedback:</span> {t.qa_feedback}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
