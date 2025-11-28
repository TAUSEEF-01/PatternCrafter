import { useEffect, useMemo, useState } from "react";
import {
  Link as RouterLink,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Project, Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";
import AnnotationViewer from "@/components/AnnotationViewer";

// Helper component to render structured data
function DataViewer({ data, title }: { data: any; title?: string }) {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 dark:text-gray-400 text-sm">No data available</div>;
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined)
      return <span className="text-gray-400 dark:text-gray-500">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      if (value.length === 0)
        return <span className="text-gray-400 dark:text-gray-500">Empty</span>;
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words"
            >
              • {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "object") {
      return (
        <div className="pl-3 space-y-2 border-l-2 border-gray-200 dark:border-gray-700">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {k.replace(/_/g, " ")}:
              </span>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{renderValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
        {String(value)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
        >
          <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 capitalize flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            {key.replace(/_/g, " ")}
          </div>
          <div className="pl-4">
            {renderValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CompletedTasksPage() {
  // Temporary workaround for react-router-dom Link typing mismatch in this workspace
  const Link = RouterLink as unknown as any;
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [annotators, setAnnotators] = useState<
    Map<string, { name: string; email: string }>
  >(new Map());
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const annotatorId = searchParams.get("annotator_id") || "";

  const canView = useMemo(() => user && user.role !== "annotator", [user]);

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
      const q = annotatorId
        ? `?annotator_id=${encodeURIComponent(annotatorId)}`
        : "";
      const list = await apiFetch<Task[]>(
        `/projects/${projectId}/completed-tasks${q}`
      );
      setTasks(list);

      // Fetch annotator details for all unique annotator IDs
      const annotatorIds = new Set<string>();
      list.forEach((task) => {
        if (task.assigned_annotator_id)
          annotatorIds.add(task.assigned_annotator_id);
        if (task.assigned_qa_id) annotatorIds.add(task.assigned_qa_id);
      });

      // Fetch all annotators from the project
      if (annotatorIds.size > 0) {
        try {
          const annotatorsList = await apiFetch<
            { id: string; name: string; email: string }[]
          >(`/projects/${projectId}/annotators`);
          const annotatorMap = new Map();
          annotatorsList.forEach((a) => {
            annotatorMap.set(a.id, { name: a.name, email: a.email });
          });
          setAnnotators(annotatorMap);
        } catch (e) {
          console.warn("Failed to load annotator details:", e);
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load completed tasks");
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
    if (val) next.set("annotator_id", val);
    else next.delete("annotator_id");
    setSearchParams(next);
  };

  const download = async (format: "csv" | "json") => {
    if (!projectId) return;
    try {
      const qParts = [`format=${format}`];
      if (annotatorId)
        qParts.push(`annotator_id=${encodeURIComponent(annotatorId)}`);
      const query = qParts.length ? `?${qParts.join("&")}` : "";

      // For JSON, apiFetch will parse the JSON. For CSV we get raw text.
      if (format === "json") {
        const jsonData = await apiFetch<any>(
          `/projects/${projectId}/completed-tasks/export${query}`
        );
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `completed_tasks_${projectId}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
      } else {
        const csvData = await apiFetch<string>(
          `/projects/${projectId}/completed-tasks/export${query}`
        );
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `completed_tasks_${projectId}.csv`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
      }
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
        <button
          className="btn btn-outline"
          onClick={() => loadTasks()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <button className="btn btn-outline" onClick={() => download("csv")}>
          Download CSV
        </button>
        <button className="btn btn-outline" onClick={() => download("json")}>
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
                    <span className="font-semibold text-base">
                      Task {t.id.slice(0, 8)}
                    </span>
                    <span className="badge badge-primary">{t.category}</span>
                    <span className="badge badge-green">Completed</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Annotator:</span>
                      {t.assigned_annotator_id ? (
                        <span className="text-gray-800">
                          {annotators.get(t.assigned_annotator_id)?.name ||
                            t.assigned_annotator_id}
                          {annotators.get(t.assigned_annotator_id)?.email && (
                            <span className="text-gray-500 ml-1">
                              ({annotators.get(t.assigned_annotator_id)?.email})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">QA Reviewer:</span>
                      {t.assigned_qa_id ? (
                        <span className="text-gray-800">
                          {annotators.get(t.assigned_qa_id)?.name ||
                            t.assigned_qa_id}
                          {annotators.get(t.assigned_qa_id)?.email && (
                            <span className="text-gray-500 ml-1">
                              ({annotators.get(t.assigned_qa_id)?.email})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div>
                      Annotator Completed:{" "}
                      {t.annotator_completed_at
                        ? new Date(t.annotator_completed_at).toLocaleString()
                        : "—"}
                      {" | "}
                      QA Completed:{" "}
                      {t.qa_completed_at
                        ? new Date(t.qa_completed_at).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    className="btn btn-outline btn-sm"
                    to={`/tasks/${t.id}/qa`}
                  >
                    Manager Review
                  </Link>
                  <Link
                    className="btn btn-outline btn-sm"
                    to={`/tasks/${t.id}/annotate`}
                  >
                    View Annotation
                  </Link>
                </div>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Task Data
                </summary>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
                  <DataViewer data={t.task_data} />
                </div>
              </details>
              {t.annotation && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Annotation Data
                  </summary>
                  <div className="mt-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 shadow-md">
                    <AnnotationViewer task={t} />
                  </div>
                </details>
              )}
              {t.qa_annotation && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    QA Annotation
                  </summary>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mt-2 space-y-4 shadow-md">
                    {t.qa_annotation.decision && (
                      <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Decision
                          </span>
                          <span
                            className={`px-4 py-2 rounded-full font-bold text-sm shadow-md ${
                              t.qa_annotation.decision === "approve"
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                : t.qa_annotation.decision === "reject"
                                ? "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                                : "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                            }`}
                          >
                            {t.qa_annotation.decision === "approve" && "✓ "}
                            {t.qa_annotation.decision === "reject" && "✗ "}
                            {t.qa_annotation.decision === "revise" && "↻ "}
                            {t.qa_annotation.decision.charAt(0).toUpperCase() +
                              t.qa_annotation.decision.slice(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Ratings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {t.qa_annotation.quality_score !== undefined && (
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Quality Score</div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t.qa_annotation.quality_score}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
                          </div>
                        </div>
                      )}
                      {t.qa_annotation.accuracy_rating !== undefined && (
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Accuracy Rating</div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{t.qa_annotation.accuracy_rating}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
                          </div>
                        </div>
                      )}
                      {t.qa_annotation.completeness_rating !== undefined && (
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Completeness Rating</div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{t.qa_annotation.completeness_rating}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
                          </div>
                        </div>
                      )}
                      {t.qa_annotation.clarity_rating !== undefined && (
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Clarity Rating</div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{t.qa_annotation.clarity_rating}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {t.qa_annotation.corrections && (
                      <div className="bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Corrections
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {typeof t.qa_annotation.corrections === "string"
                            ? t.qa_annotation.corrections
                            : JSON.stringify(
                                t.qa_annotation.corrections,
                                null,
                                2
                              )}
                        </div>
                      </div>
                    )}
                    {t.qa_annotation.notes && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Notes
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {t.qa_annotation.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}
              {t.qa_feedback && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-sm font-medium text-blue-900">
                    QA Feedback:
                  </span>{" "}
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
