import { useEffect, useMemo, useState } from "react";
import {
  Link as RouterLink,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Project, Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

// Helper component to render structured data
function DataViewer({ data, title }: { data: any; title?: string }) {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined)
      return <span className="text-gray-400">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      if (value.length === 0)
        return <span className="text-gray-400">Empty</span>;
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="text-sm text-gray-700 whitespace-pre-wrap break-words"
            >
              • {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "object") {
      return (
        <div className="pl-3 space-y-2 border-l-2 border-gray-200">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="text-xs font-semibold text-gray-600">
                {k.replace(/_/g, " ")}:
              </span>
              <div className="text-sm text-gray-700 mt-1">{renderValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
        {String(value)}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
        >
          <div className="text-sm font-semibold text-gray-800 mb-1.5 capitalize">
            {key.replace(/_/g, " ")}
          </div>
          {renderValue(value)}
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
      const data = await apiFetch<string>(
        `/projects/${projectId}/completed-tasks/export${query}`
      );
      const blob = new Blob([data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Task Data
                </summary>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
                  <DataViewer data={t.task_data} />
                </div>
              </details>
              {t.annotation && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Annotation
                  </summary>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2 max-h-96 overflow-auto scrollbar-thin">
                    <DataViewer data={t.annotation} />
                  </div>
                </details>
              )}
              {t.qa_annotation && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    QA Annotation
                  </summary>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2 space-y-3">
                    {t.qa_annotation.decision && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-36">
                          Decision:
                        </span>
                        <span
                          className={`badge ${
                            t.qa_annotation.decision === "approve"
                              ? "badge-green"
                              : t.qa_annotation.decision === "reject"
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300"
                          }`}
                        >
                          {t.qa_annotation.decision === "approve" && "✓ "}
                          {t.qa_annotation.decision === "reject" && "✗ "}
                          {t.qa_annotation.decision === "revise" && "↻ "}
                          {t.qa_annotation.decision.charAt(0).toUpperCase() +
                            t.qa_annotation.decision.slice(1)}
                        </span>
                      </div>
                    )}
                    {t.qa_annotation.quality_score !== undefined && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-36">
                          Quality Score:
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {t.qa_annotation.quality_score} / 10
                        </span>
                      </div>
                    )}
                    {t.qa_annotation.accuracy_rating !== undefined && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-36">
                          Accuracy Rating:
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {t.qa_annotation.accuracy_rating} / 10
                        </span>
                      </div>
                    )}
                    {t.qa_annotation.completeness_rating !== undefined && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-36">
                          Completeness Rating:
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {t.qa_annotation.completeness_rating} / 10
                        </span>
                      </div>
                    )}
                    {t.qa_annotation.clarity_rating !== undefined && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-36">
                          Clarity Rating:
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {t.qa_annotation.clarity_rating} / 10
                        </span>
                      </div>
                    )}
                    {t.qa_annotation.corrections && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Corrections:
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
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
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Notes:
                        </div>
                        <div className="bg-white border border-gray-300 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
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
