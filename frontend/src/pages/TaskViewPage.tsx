import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";
import AnnotationViewer from "@/components/AnnotationViewer";

const LinkFix = RouterLink as unknown as any;

export default function TaskViewPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [annotatorName, setAnnotatorName] = useState<string>("");
  const [qaName, setQaName] = useState<string>("");

  useEffect(() => {
    if (!taskId) return;

    apiFetch<Task>(`/tasks/${taskId}`)
      .then(async (t) => {
        setTask(t);

        // Load annotator and QA names
        if (t.project_id) {
          try {
            const annotators = await apiFetch<
              { id: string; name: string; email: string }[]
            >(`/projects/${t.project_id}/annotators`);

            const annotator = annotators.find(
              (a) => a.id === t.assigned_annotator_id
            );
            if (annotator) setAnnotatorName(annotator.name);

            const qaList = await apiFetch<
              { id: string; name: string; email: string }[]
            >(`/projects/${t.project_id}/qa-annotators`);

            const qa = qaList.find((q) => q.id === t.assigned_qa_id);
            if (qa) setQaName(qa.name);
          } catch (e) {
            console.error("Failed to load user names:", e);
          }
        }
      })
      .catch((e) => setError(String(e)));
  }, [taskId]);

  const getStatusBadge = () => {
    if (!task) return null;

    if (task.is_returned) {
      return (
        <span className="badge bg-amber-100 text-amber-700">⚠️ Returned</span>
      );
    }
    if (task.completed_status?.qa_part) {
      return <span className="badge badge-green">✅ Completed</span>;
    }
    if (task.completed_status?.annotator_part) {
      return <span className="badge badge-primary">📝 Awaiting QA</span>;
    }
    if (task.assigned_annotator_id) {
      return <span className="badge badge-yellow">⏳ In Progress</span>;
    }
    return (
      <span className="badge bg-gray-100 text-gray-700">📋 Unassigned</span>
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>Task View</h1>
          <LinkFix className="btn btn-ghost" to={-1}>
            ← Back
          </LinkFix>
        </div>
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading task...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1>Task Details</h1>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Task ID:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{task.id}</code>
          </p>
        </div>
        <LinkFix className="btn btn-ghost" to={`/projects/${task.project_id}`}>
          ← Back to Project
        </LinkFix>
      </div>

      {/* Task Information */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-3">
                📋 Basic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Category
                  </div>
                  <div className="badge badge-primary mt-1">
                    {task.category}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Created At
                  </div>
                  <div className="text-sm mt-1">
                    {task.created_at
                      ? new Date(task.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
                {task.accumulated_time && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">
                      Accumulated Time
                    </div>
                    <div className="text-sm mt-1">
                      {Math.round(task.accumulated_time / 60)} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-3">👥 Assignment</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Assigned Annotator
                  </div>
                  <div className="text-sm mt-1">
                    {annotatorName || task.assigned_annotator_id || (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                  {task.annotator_started_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      Started:{" "}
                      {new Date(task.annotator_started_at).toLocaleString()}
                    </div>
                  )}
                  {task.annotator_completed_at && (
                    <div className="text-xs text-gray-500">
                      Completed:{" "}
                      {new Date(task.annotator_completed_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Assigned QA Reviewer
                  </div>
                  <div className="text-sm mt-1">
                    {qaName || task.assigned_qa_id || (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                  {task.qa_started_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      Started: {new Date(task.qa_started_at).toLocaleString()}
                    </div>
                  )}
                  {task.qa_completed_at && (
                    <div className="text-xs text-gray-500">
                      Completed:{" "}
                      {new Date(task.qa_completed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Completion Status */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-3">
                ✓ Completion Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Annotator Part</span>
                  {task.completed_status?.annotator_part ? (
                    <span className="badge badge-green">✓ Complete</span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-600">
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">QA Part</span>
                  {task.completed_status?.qa_part ? (
                    <span className="badge badge-green">✓ Complete</span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-600">
                      Pending
                    </span>
                  )}
                </div>
                {task.is_returned && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                    <div className="text-sm font-medium text-amber-800">
                      ⚠️ Task Returned for Revision
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {user?.role !== "annotator" && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-3">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  <LinkFix
                    to={`/tasks/${task.id}/assign`}
                    className="btn btn-outline w-full"
                  >
                    📌 Assign Annotator
                  </LinkFix>
                  <LinkFix
                    to={`/tasks/${task.id}/assign-qa`}
                    className="btn btn-outline w-full"
                  >
                    🔍 Assign QA Reviewer
                  </LinkFix>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Data */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-3">📄 Task Data</h3>
          <div className="space-y-4">
            {task.task_data && typeof task.task_data === "object" ? (
              Object.entries(task.task_data).map(([key, value]) => (
                <div
                  key={key}
                  className="border-b border-gray-200 pb-3 last:border-b-0"
                >
                  <div className="text-sm font-semibold text-gray-700 mb-1 capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm text-gray-900">
                    {typeof value === "object" ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                No task data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Annotation */}
      {task.annotation && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-3">✍️ Annotation</h3>
            {task.category === 'object_detection' ? (
              <AnnotationViewer task={task} />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {task.annotation.grade !== undefined && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Grade
                    </div>
                    <div className="badge badge-primary text-lg">
                      {task.annotation.grade}
                    </div>
                  </div>
                )}
                {task.annotation.confidence !== undefined && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Confidence
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {(task.annotation.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-700"
                          style={{
                            width: `${task.annotation.confidence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {task.annotation.reasoning && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Reasoning
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                      {task.annotation.reasoning}
                    </div>
                  </div>
                )}
                {task.annotation.notes && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Notes
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                      {task.annotation.notes || (
                        <span className="text-gray-400 italic">No notes</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QA Annotation */}
      {task.qa_annotation && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-3">🔍 QA Review</h3>
            <div className="space-y-4">
              {task.qa_annotation.decision && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Decision
                  </div>
                  <div>
                    {task.qa_annotation.decision === "approve" ? (
                      <span className="badge bg-green-100 text-green-700 text-base px-4 py-2">
                        ✓ Approved
                      </span>
                    ) : task.qa_annotation.decision === "reject" ? (
                      <span className="badge bg-red-100 text-red-700 text-base px-4 py-2">
                        ✗ Rejected
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700 text-base px-4 py-2">
                        ⚠️ Needs Revision
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {task.qa_annotation.quality_score !== undefined && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Quality Score
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-purple-600">
                        {task.qa_annotation.quality_score}
                      </div>
                      <div className="text-sm text-gray-500">/ 5</div>
                    </div>
                  </div>
                )}
                {task.qa_annotation.accuracy_rating !== undefined && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Accuracy Rating
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {task.qa_annotation.accuracy_rating}
                      </div>
                      <div className="text-sm text-gray-500">/ 5</div>
                    </div>
                  </div>
                )}
                {task.qa_annotation.completeness_rating !== undefined && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Completeness Rating
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-green-600">
                        {task.qa_annotation.completeness_rating}
                      </div>
                      <div className="text-sm text-gray-500">/ 5</div>
                    </div>
                  </div>
                )}
                {task.qa_annotation.clarity_rating !== undefined && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Clarity Rating
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-indigo-600">
                        {task.qa_annotation.clarity_rating}
                      </div>
                      <div className="text-sm text-gray-500">/ 5</div>
                    </div>
                  </div>
                )}
              </div>

              {task.qa_feedback && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    QA Feedback
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    {task.qa_feedback}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
