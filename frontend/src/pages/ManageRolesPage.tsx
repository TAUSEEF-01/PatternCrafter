import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";

const LinkFix = RouterLink as unknown as any;

export default function ManageRolesPage() {
  const { projectId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const [projectAnnotators, setProjectAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [qaAnnotators, setQaAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [selectedQaIds, setSelectedQaIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!projectId) return;

    // Load annotators
    apiFetch<{ id: string; name: string; email: string }[]>(
      `/projects/${projectId}/annotators`
    )
      .then(setProjectAnnotators)
      .catch((e) => setError("Failed to load annotators: " + String(e)));

    // Load QA annotators
    apiFetch<{ id: string; name: string; email: string }[]>(
      `/projects/${projectId}/qa-annotators`
    )
      .then((qaList) => {
        setQaAnnotators(qaList);
        setSelectedQaIds(qaList.map((q) => q.id));
      })
      .catch((e) => setError("Failed to load QA annotators: " + String(e)));
  }, [projectId]);

  const updateQaAnnotators = async () => {
    if (!projectId) return;
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/projects/${projectId}/qa-annotators`, {
        method: "PUT",
        body: selectedQaIds,
      });

      // Reload QA annotators
      const qaList = await apiFetch<
        { id: string; name: string; email: string }[]
      >(`/projects/${projectId}/qa-annotators`);
      setQaAnnotators(qaList);
      setSaving(false);
      setNotification({
        message: "QA reviewers updated successfully!",
        type: "success",
      });
    } catch (e: any) {
      setError(e?.message || "Failed to update QA annotators");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 max-w-md animate-slide-in-right shadow-2xl rounded-xl border-2 p-4 flex items-start gap-3 ${
            notification.type === "success"
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
          }`}
        >
          <div className="flex-shrink-0">
            {notification.type === "success" ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold ${
                notification.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
              notification.type === "success"
                ? "hover:bg-green-200 text-green-600"
                : "hover:bg-red-200 text-red-600"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1>Manage Roles</h1>
        <LinkFix className="btn btn-ghost" to={`/projects/${projectId}`}>
          ← Back to Project
        </LinkFix>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current QA Reviewers */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Current QA Reviewers</h2>
          {qaAnnotators.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No QA reviewers assigned yet
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {qaAnnotators.map((qa) => (
                <div key={qa.id} className="border rounded-lg p-3 bg-green-50">
                  <div className="font-medium">{qa.name}</div>
                  <div className="text-sm text-gray-600">{qa.email}</div>
                  <div className="badge badge-green badge-sm mt-2">
                    QA Reviewer
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Annotators */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">All Annotators in Project</h2>
          {projectAnnotators.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No annotators in this project yet. Invite annotators first.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {projectAnnotators.map((annotator) => (
                <div
                  key={annotator.id}
                  className={`border rounded-lg p-3 ${
                    selectedQaIds.includes(annotator.id)
                      ? "bg-blue-50 border-blue-300"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="font-medium">{annotator.name}</div>
                  <div className="text-sm text-gray-600">{annotator.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="badge badge-sm">Annotator</div>
                    {selectedQaIds.includes(annotator.id) && (
                      <div className="badge badge-blue badge-sm">QA</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Select QA Reviewers */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Assign QA Reviewers</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select which annotators should have QA review permissions for this
            project. QA reviewers can review and approve completed annotations.
          </p>

          {projectAnnotators.length === 0 ? (
            <p className="text-sm text-gray-500">
              No annotators available to assign as QA reviewers.
            </p>
          ) : (
            <div className="space-y-2">
              {projectAnnotators.map((annotator) => (
                <label
                  key={annotator.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedQaIds.includes(annotator.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQaIds([...selectedQaIds, annotator.id]);
                      } else {
                        setSelectedQaIds(
                          selectedQaIds.filter((id) => id !== annotator.id)
                        );
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{annotator.name}</div>
                    <div className="text-sm text-gray-500">
                      {annotator.email}
                    </div>
                  </div>
                  {selectedQaIds.includes(annotator.id) && (
                    <div className="badge badge-primary">QA Reviewer</div>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              className="btn btn-primary"
              onClick={updateQaAnnotators}
              disabled={projectAnnotators.length === 0 || saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <LinkFix className="btn btn-outline" to={`/projects/${projectId}`}>
              Cancel
            </LinkFix>
          </div>
        </div>
      </div>
    </div>
  );
}
