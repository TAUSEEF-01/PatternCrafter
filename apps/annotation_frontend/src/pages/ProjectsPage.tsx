import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/api/client';
import { Link } from 'react-router-dom';
import { Project } from '@/types';

const CATEGORIES = [
  'LLM_RESPONSE_GRADING',
  'RESPONSE_SELECTION',
  'TEXT_CLASSIFICATION',
  'NER',
  'IMAGE_CLASSIFICATION',
  'OBJECT_DETECTION',
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Project[]>('/projects')
      .then(setProjects)
      .catch((e) => setError(String(e)));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        details: details ? JSON.parse(details) : {},
        category,
      };
      const p = await apiFetch<Project>('/projects', { method: 'POST', body });
      setProjects((prev) => [p, ...prev]);
      setDetails('');
    } catch (e: any) {
      setError(e?.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <div className="flex items-center gap-3">
          <label className="w-40">Category</label>
          <select
            className="border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Details (JSON)</label>
          <textarea
            className="w-full border rounded p-2 h-28 font-mono"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder='{"name":"Project A"}'
          />
        </div>
        <button className="bg-blue-600 text-white rounded px-4 py-2">Create Project</button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <ul className="grid sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <li key={p.id} className="bg-white p-4 rounded shadow">
            <div className="font-semibold">
              {(p.details && (p.details.name || p.details.title)) || p.id}
            </div>
            <div className="text-sm text-gray-500">Category: {p.category}</div>
            <Link
              className="inline-block mt-2 text-blue-600 hover:underline"
              to={`/projects/${p.id}`}
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
