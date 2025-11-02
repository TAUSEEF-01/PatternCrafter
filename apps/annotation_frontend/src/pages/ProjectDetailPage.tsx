import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Project, Task } from '@/types';

const CATEGORIES = [
  'LLM_RESPONSE_GRADING',
  'RESPONSE_SELECTION',
  'TEXT_CLASSIFICATION',
  'NER',
  'IMAGE_CLASSIFICATION',
  'OBJECT_DETECTION',
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [taskData, setTaskData] = useState('');
  const category = useMemo(() => project?.category || CATEGORIES[0], [project]);

  useEffect(() => {
    if (!projectId) return;
    apiFetch<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch((e) => setError(String(e)));
    apiFetch<Task[]>(`/projects/${projectId}/tasks`)
      .then(setTasks)
      .catch((e) => setError(String(e)));
  }, [projectId]);

  const createTask = async () => {
    if (!projectId) return;
    try {
      const body = {
        category,
        task_data: taskData ? JSON.parse(taskData) : {},
      };
      const t = await apiFetch<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body });
      setTasks((prev) => [t, ...prev]);
      setTaskData('');
    } catch (e: any) {
      setError(e?.message || 'Failed to create task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Project</h1>
          {project && <div className="text-gray-600 text-sm">Category: {project.category}</div>}
        </div>
        <Link className="text-blue-600 hover:underline" to="/projects">
          Back
        </Link>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold">Create Task ({category})</h2>
        <textarea
          className="w-full border rounded p-2 h-36 font-mono"
          value={taskData}
          onChange={(e) => setTaskData(e.target.value)}
          placeholder='{"input":"text or JSON per category"}'
        />
        <button onClick={createTask} className="bg-blue-600 text-white rounded px-4 py-2">
          Add Task
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid gap-3">
        {tasks.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Task {t.id.slice(0, 8)}</div>
                <div className="text-sm text-gray-600">Category: {t.category}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link className="text-blue-600 hover:underline" to={`/tasks/${t.id}/assign`}>
                  Assign
                </Link>
                <Link className="text-blue-600 hover:underline" to={`/tasks/${t.id}/annotate`}>
                  Annotate
                </Link>
                <Link className="text-blue-600 hover:underline" to={`/tasks/${t.id}/qa`}>
                  QA
                </Link>
              </div>
            </div>
            <pre className="bg-gray-50 p-2 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(t.task_data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
