import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/api/client';
import { Link } from 'react-router-dom';
import { Project } from '@/types';
import { useAuth } from '@/auth/AuthContext';

// Backend expects enum VALUES (snake_case), not enum NAMES.
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'generative_ai_llm_response_grading', label: 'LLM Response Grading' },
  { value: 'generative_ai_chatbot_assessment', label: 'Chatbot Model Assessment' },
  { value: 'conversational_ai_response_selection', label: 'Response Selection' },
  { value: 'text_classification', label: 'Text Classification' },
  { value: 'image_classification', label: 'Image Classification' },
  { value: 'object_detection', label: 'Object Detection' },
  { value: 'named_entity_recognition', label: 'Named Entity Recognition (NER)' },
  { value: 'sentiment_analysis', label: 'Sentiment Analysis' },
  { value: 'text_summarization', label: 'Text Summarization' },
  { value: 'qa_evaluation', label: 'QA Evaluation' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    apiFetch<Project[]>('/projects')
      .then(setProjects)
      .catch((e) => setError(String(e)));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body = { details: name.trim(), category };
      const p = await apiFetch<Project>('/projects', { method: 'POST', body });
      setProjects((prev) => [p, ...prev]);
      setName('');
    } catch (e: any) {
      setError(e?.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      {user?.role === 'manager' && (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-40">Name</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Project A"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-40">Category</label>
            <select
              className="border rounded px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button className="bg-blue-600 text-white rounded px-4 py-2">Create Project</button>
        </form>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <ul className="grid sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <li key={p.id} className="bg-white p-4 rounded shadow">
            <div className="font-semibold">{p.details || p.id}</div>
            <div className="text-sm text-gray-500">Category: {p.category}</div>
            {user?.role === 'manager' || user?.role === 'admin' ? (
              <div className="mt-2 flex gap-4">
                <Link className="text-blue-600 hover:underline" to={`/projects/${p.id}`}>
                  Open
                </Link>
                <Link className="text-blue-600 hover:underline" to={`/projects/${p.id}/invites`}>
                  Manage Invites
                </Link>
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-400">Signaled: names/details only</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
