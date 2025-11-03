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
          <h1>Completed Tasks</h1>
          {project && (
            <div className="muted mt-1 space-y-0.5">
              <div>{project.details}</div>
              <span className="badge badge-primary">{project.category}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {projectId && (
            <Link className="btn btn-ghost" to={`/projects/${projectId}`}>
              ← Back to Project
            </Link>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="flex-1">
          <label className="label">Filter by Annotator ID</label>
          <input
            className="input w-full max-w-xs"
            placeholder="annotator user id (optional)"
            value={annotatorId}
            onChange={(e) => updateAnnotatorId(e.target.value)}
          />
        </div>
        <button className="btn btn-outline" onClick={() => loadTasks()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <button className="btn btn-outline" onClick={() => download('csv')}>
          Download CSV
        </button>
        <button className="btn btn-outline" onClick={() => download('json')}>
          Download JSON
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {tasks.length === 0 && !loading && (
          <div className="card">
            <div className="card-body text-center py-12">
              <p className="muted">No completed tasks found</p>
            </div>
          </div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-base">Task {t.id.slice(0, 8)}</span>
                    <span className="badge badge-primary">{t.category}</span>
                    <span className="badge badge-green">Completed</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Annotator: {t.assigned_annotator_id || '—'} | QA: {t.assigned_qa_id || '—'}
                    </div>
                    <div>
                      Annotator Completed: {t.annotator_completed_at || '—'} | QA Completed:{' '}
                      {t.qa_completed_at || '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="btn btn-outline btn-sm" to={`/tasks/${t.id}/qa`}>
                    View QA
                  </Link>
                  <Link className="btn btn-outline btn-sm" to={`/tasks/${t.id}/annotate`}>
                    View Annotation
                  </Link>
                </div>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Task Data
                </summary>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 text-xs font-mono overflow-auto scrollbar-thin max-h-64">
                  {JSON.stringify(t.task_data, null, 2)}
                </pre>
              </details>
              {t.annotation && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Annotation
                  </summary>
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 text-xs font-mono overflow-auto scrollbar-thin max-h-64">
                    {JSON.stringify(t.annotation, null, 2)}
                  </pre>
                </details>
              )}
              {t.qa_annotation && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    QA Annotation
                  </summary>
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 text-xs font-mono overflow-auto scrollbar-thin max-h-64">
                    {JSON.stringify(t.qa_annotation, null, 2)}
                  </pre>
                </details>
              )}
              {t.qa_feedback && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-sm font-medium text-blue-900">QA Feedback:</span>{' '}
                  <span className="text-sm text-blue-800">{t.qa_feedback}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
