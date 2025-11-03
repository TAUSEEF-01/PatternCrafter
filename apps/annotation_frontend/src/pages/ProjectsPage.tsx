import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/api/client';
import { Link as RRLink } from 'react-router-dom';
import { Project } from '@/types';
import { useAuth } from '@/auth/AuthContext';

const Link = RRLink as unknown as any;

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
  const [acceptedProjectIds, setAcceptedProjectIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch<Project[]>('/projects')
      .then(setProjects)
      .catch((e) => setError(String(e)));
    // For annotators, fetch invites to know which projects they can open
    if (user?.role === 'annotator') {
      apiFetch<Array<{ id: string; project_id: string; accepted_status: boolean }>>('/invites')
        .then((invites) => {
          const accepted = new Set<string>();
          invites.forEach((inv) => {
            if (inv.accepted_status && inv.project_id) accepted.add(inv.project_id);
          });
          setAcceptedProjectIds(accepted);
        })
        .catch(() => {});
    }
  }, [user?.role]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1>Projects</h1>
          <p className="muted mt-1">Manage your annotation projects</p>
        </div>
      </div>

      {user?.role === 'manager' && (
        <div className="card">
          <div className="card-body">
            <h2 className="card-title mb-4">Create New Project</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q3 Sentiment Analysis"
                  required
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="select"
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
              <button type="submit" className="btn btn-primary">
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No projects yet</div>
            <p className="muted">
              {user?.role === 'manager'
                ? 'Create a new project to get started'
                : "You'll see projects here once you're invited"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="font-semibold text-base mb-1">{p.details || p.id}</h3>
                <span className="badge badge-primary mb-3 w-fit">{p.category}</span>
                {user?.role === 'manager' || user?.role === 'admin' ? (
                  <div className="flex gap-3 mt-auto">
                    <Link
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      to={`/projects/${p.id}`}
                    >
                      Open →
                    </Link>
                    <Link
                      className="text-sm text-gray-600 hover:text-gray-900"
                      to={`/projects/${p.id}/invites`}
                    >
                      Invites
                    </Link>
                  </div>
                ) : (
                  <div className="mt-auto">
                    {acceptedProjectIds.has(p.id) ? (
                      <Link
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        to={`/projects/${p.id}`}
                      >
                        Open →
                      </Link>
                    ) : (
                      <div className="text-xs text-gray-400">Pending invite</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
