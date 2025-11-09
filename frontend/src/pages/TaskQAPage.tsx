import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";

function TaskDataViewer({ data }: { data: any }) {
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
      if (typeof value[0] === "string") {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div
                key={idx}
                className="text-sm text-gray-700 whitespace-pre-wrap break-words"
              >
                • {item}
              </div>
            ))}
          </div>
        );
      }
      if (typeof value[0] === "object") {
        return (
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  Item {idx + 1}
                </div>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="text-sm mb-1">
                    <span className="font-medium text-gray-600">{k}:</span>{" "}
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return value.join(", ");
    }
    if (typeof value === "object") {
      return (
        <div className="pl-3 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="font-medium text-gray-600">{k}:</span>{" "}
              <span className="text-gray-700">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <span className="text-gray-700 whitespace-pre-wrap break-words">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
        >
          <div className="text-sm font-semibold text-gray-800 mb-1 capitalize">
            {key.replace(/_/g, " ")}
          </div>
          <div className="text-sm">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function TaskQAPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // QA Review Fields
  const [decision, setDecision] = useState<"approve" | "reject" | "revise">(
    "approve"
  );
  const [qualityScore, setQualityScore] = useState("5");
  const [accuracyRating, setAccuracyRating] = useState("5");
  const [completenessRating, setCompletenessRating] = useState("5");
  const [clarityRating, setClarityRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [corrections, setCorrections] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!taskId) return;
    apiFetch<Task>(`/tasks/${taskId}`)
      .then(setTask)
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    if (decision === "reject") {
      // If rejecting, return the task to annotator
      if (
        !confirm(
          "Are you sure you want to return this task to the annotator for revision? They will need to resubmit."
        )
      ) {
        return;
      }

      try {
        await apiFetch(`/tasks/${taskId}/return`, { method: "PUT" });
        setSuccess("Task returned to annotator for revision!");
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to return task");
        setSuccess(null);
      }
      return;
    }

    // For approve or revise, submit QA annotation
    const qaAnnotation: any = {
      decision: decision,
      quality_score: parseInt(qualityScore) || 5,
      accuracy_rating: parseInt(accuracyRating) || 5,
      completeness_rating: parseInt(completenessRating) || 5,
      clarity_rating: parseInt(clarityRating) || 5,
    };

    // Add corrections if provided
    if (corrections.trim()) {
      try {
        qaAnnotation.corrections = JSON.parse(corrections);
      } catch {
        // If not JSON, store as text
        qaAnnotation.corrections = corrections;
      }
    }

    // Add notes if provided
    if (notes.trim()) {
      qaAnnotation.notes = notes;
    }

    try {
      const body = {
        qa_annotation: qaAnnotation,
        qa_feedback: feedback.trim() || undefined,
      };
      await apiFetch(`/tasks/${taskId}/qa`, { method: "PUT", body });
      setSuccess(
        decision === "approve"
          ? "Task approved and marked as complete!"
          : "Task completed with revision notes!"
      );
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to submit QA review");
      setSuccess(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>QA Review</h1>
        <p className="muted mt-1">
          Review the annotation and provide quality assurance feedback
        </p>
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
                <span className="font-mono text-gray-600">
                  {task.id.slice(0, 8)}
                </span>
                <span className="badge badge-primary">{task.category}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Task Data</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto scrollbar-thin">
                <TaskDataViewer data={task.task_data} />
              </div>
            </div>
            {task.annotation && (
              <div>
                <h3 className="font-medium mb-2">Annotator Annotation</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-64 overflow-auto scrollbar-thin">
                  <TaskDataViewer data={task.annotation} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Submit QA Review</h2>
          <form onSubmit={submit} className="space-y-6">
            {/* Decision Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-gray-800">
                Review Decision
              </h3>
              <div>
                <label className="label">Decision *</label>
                <select
                  className="select"
                  value={decision}
                  onChange={(e) =>
                    setDecision(
                      e.target.value as "approve" | "reject" | "revise"
                    )
                  }
                  required
                >
                  <option value="approve">
                    ✓ Approve & Complete - Mark task as fully completed
                  </option>
                  <option value="revise">
                    ↻ Complete with Notes - Mark complete but add feedback
                  </option>
                  <option value="reject">
                    ← Return to Annotator - Send back for revision
                  </option>
                </select>
                {decision === "reject" && (
                  <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ This will return the task to the annotator. Their
                    annotation will be cleared and they will need to resubmit.
                  </p>
                )}
              </div>
            </div>

            {/* Quality Ratings Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-gray-800">
                Quality Ratings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Overall Quality Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={qualityScore}
                    onChange={(e) => setQualityScore(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 = Poor, 10 = Excellent
                  </p>
                </div>

                <div>
                  <label className="label">Accuracy Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={accuracyRating}
                    onChange={(e) => setAccuracyRating(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How correct is the annotation?
                  </p>
                </div>

                <div>
                  <label className="label">Completeness Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={completenessRating}
                    onChange={(e) => setCompletenessRating(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Is all required information included?
                  </p>
                </div>

                <div>
                  <label className="label">Clarity Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={clarityRating}
                    onChange={(e) => setClarityRating(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How clear and well-structured?
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-gray-800">
                Detailed Feedback
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Feedback for Annotator</label>
                  <textarea
                    className="textarea h-24"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback about the annotation quality, what was done well, and what could be improved..."
                  />
                </div>

                {decision !== "approve" && (
                  <div>
                    <label className="label">
                      Corrections Needed{" "}
                      <span className="text-xs text-gray-500">
                        (JSON or text)
                      </span>
                    </label>
                    <textarea
                      className="textarea font-mono text-sm h-32"
                      value={corrections}
                      onChange={(e) => setCorrections(e.target.value)}
                      placeholder='Specify corrections as JSON, e.g., {"corrected_label": "positive"} or as plain text'
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Provide specific corrections that need to be
                      made
                    </p>
                  </div>
                )}

                <div>
                  <label className="label">Internal Notes (optional)</label>
                  <textarea
                    className="textarea h-20"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any internal notes for managers or future reference..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className={`btn flex-1 ${
                  decision === "approve"
                    ? "btn-primary"
                    : decision === "revise"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {decision === "approve" && "✓ Approve & Mark Complete"}
                {decision === "revise" && "✓ Complete with Feedback"}
                {decision === "reject" && "← Return to Annotator"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
