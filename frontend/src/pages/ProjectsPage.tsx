import { useTheme } from "@/components/NavBar";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import { Link as RRLink } from "react-router-dom";
import { Project } from "@/types";
import { useAuth } from "@/auth/AuthContext";

const Link = RRLink as unknown as any;

// Backend expects enum VALUES (snake_case), not enum NAMES.
const CATEGORIES: { value: string; label: string }[] = [
  {
    value: "generative_ai_llm_response_grading",
    label: "LLM Response Grading",
  },
  {
    value: "generative_ai_chatbot_assessment",
    label: "Chatbot Model Assessment",
  },
  {
    value: "conversational_ai_response_selection",
    label: "Response Selection",
  },
  { value: "text_classification", label: "Text Classification" },
  { value: "image_classification", label: "Image Classification" },
  { value: "object_detection", label: "Object Detection" },
  {
    value: "named_entity_recognition",
    label: "Named Entity Recognition (NER)",
  },
  { value: "sentiment_analysis", label: "Sentiment Analysis" },
  { value: "text_summarization", label: "Text Summarization" },
  { value: "qa_evaluation", label: "QA Evaluation" },
];

export default function ProjectsPage() {
  const { darkMode } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [acceptedProjectIds, setAcceptedProjectIds] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<"running" | "completed">(
    "running"
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);
  const [completeConfirmModal, setCompleteConfirmModal] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);
  const [reopenConfirmModal, setReopenConfirmModal] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);
  const [taskCounts, setTaskCounts] = useState<Map<string, number>>(new Map());

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    apiFetch<Project[]>("/projects")
      .then((projectsData) => {
        setProjects(projectsData);
        // Fetch task counts for each project
        projectsData.forEach((project) => {
          apiFetch<any[]>(`/projects/${project.id}/tasks`)
            .then((tasks) => {
              setTaskCounts((prev) =>
                new Map(prev).set(project.id, tasks.length)
              );
            })
            .catch(() => {
              setTaskCounts((prev) => new Map(prev).set(project.id, 0));
            });
        });
      })
      .catch((e) => setError(String(e)));
    // For annotators, fetch invites to know which projects they can open
    if (user?.role === "annotator") {
      apiFetch<
        Array<{ id: string; project_id: string; accepted_status: boolean }>
      >("/invites")
        .then((invites) => {
          const accepted = new Set<string>();
          invites.forEach((inv) => {
            if (inv.accepted_status && inv.project_id)
              accepted.add(inv.project_id);
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
      const p = await apiFetch<Project>("/projects", { method: "POST", body });
      setProjects((prev) => [p, ...prev]);
      setName("");
    } catch (e: any) {
      setError(e?.message || "Failed to create project");
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    setCompletingId(projectId);
    try {
      const updated = await apiFetch<Project>(
        `/projects/${projectId}/complete`,
        { method: "PUT" }
      );
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
      setNotification({
        message: "Project marked as complete successfully!",
        type: "success",
      });
      setCompleteConfirmModal(null);
    } catch (e: any) {
      setNotification({
        message: e?.message || "Failed to mark project as complete",
        type: "error",
      });
    } finally {
      setCompletingId(null);
    }
  };

  const handleReopenProject = async (projectId: string) => {
    try {
      const updated = await apiFetch<Project>(`/projects/${projectId}/reopen`, {
        method: "PUT",
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
      setNotification({
        message: "Project reopened successfully!",
        type: "success",
      });
      setReopenConfirmModal(null);
    } catch (e: any) {
      setNotification({
        message: e?.message || "Failed to reopen project",
        type: "error",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setNotification({
        message: "Project deleted successfully!",
        type: "success",
      });
      setDeleteConfirmModal(null);
    } catch (e: any) {
      setNotification({
        message: e?.message || "Failed to delete project",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const runningProjects = projects.filter((p) => !p.is_completed);
  const completedProjects = projects.filter((p) => p.is_completed);
  const displayedProjects =
    activeTab === "running" ? runningProjects : completedProjects;

  return (
    <div className="space-y-6 p-6">
      {/* Complete Confirmation Modal */}
      {completeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className={`relative max-w-md w-full rounded-2xl shadow-2xl border-2 p-6 animate-scale-in ${
              darkMode
                ? "bg-gray-900 border-green-700"
                : "bg-white border-green-300"
            }`}
          >
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={`rounded-full p-3 ${
                  darkMode ? "bg-green-900/30" : "bg-green-100"
                }`}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={darkMode ? "#4ade80" : "#16a34a"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-2xl font-bold text-center mb-2 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              Mark Project Complete?
            </h3>

            {/* Message */}
            <p
              className={`text-center mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              You're about to mark{" "}
              <span className="font-semibold">
                "{completeConfirmModal.projectName}"
              </span>{" "}
              as complete.
            </p>
            <p
              className={`text-sm text-center mb-6 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              This will move the project to the completed tab.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setCompleteConfirmModal(null)}
                disabled={completingId === completeConfirmModal.projectId}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleMarkComplete(completeConfirmModal.projectId)
                }
                disabled={completingId === completeConfirmModal.projectId}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg ${
                  completingId === completeConfirmModal.projectId
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                {completingId === completeConfirmModal.projectId ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Mark Complete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Confirmation Modal */}
      {reopenConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className={`relative max-w-md w-full rounded-2xl shadow-2xl border-2 p-6 animate-scale-in ${
              darkMode
                ? "bg-gray-900 border-blue-700"
                : "bg-white border-blue-300"
            }`}
          >
            {/* Info Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={`rounded-full p-3 ${
                  darkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={darkMode ? "#60a5fa" : "#2563eb"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-2xl font-bold text-center mb-2 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Reopen Project?
            </h3>

            {/* Message */}
            <p
              className={`text-center mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              You're about to reopen{" "}
              <span className="font-semibold">
                "{reopenConfirmModal.projectName}"
              </span>
            </p>
            <p
              className={`text-sm text-center mb-6 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              This will move the project back to the running tab.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setReopenConfirmModal(null)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleReopenProject(reopenConfirmModal.projectId)
                }
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Reopen Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className={`relative max-w-md w-full rounded-2xl shadow-2xl border-2 p-6 animate-scale-in ${
              darkMode
                ? "bg-gray-900 border-red-700"
                : "bg-white border-red-300"
            }`}
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={`rounded-full p-3 ${
                  darkMode ? "bg-red-900/30" : "bg-red-100"
                }`}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={darkMode ? "#f87171" : "#dc2626"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-2xl font-bold text-center mb-2 ${
                darkMode ? "text-red-400" : "text-red-600"
              }`}
            >
              Delete Project?
            </h3>

            {/* Message */}
            <p
              className={`text-center mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              You're about to delete{" "}
              <span className="font-semibold">
                "{deleteConfirmModal.projectName}"
              </span>
            </p>
            <p
              className={`text-sm text-center mb-6 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              This action cannot be undone. All project data will be permanently
              removed.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                disabled={deletingId === deleteConfirmModal.projectId}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDeleteProject(deleteConfirmModal.projectId)
                }
                disabled={deletingId === deleteConfirmModal.projectId}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg ${
                  deletingId === deleteConfirmModal.projectId
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                }`}
              >
                {deletingId === deleteConfirmModal.projectId ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete Project"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 max-w-md animate-slide-in-right shadow-2xl rounded-xl border-2 p-4 flex items-start gap-3 ${
            notification.type === "success"
              ? darkMode
                ? "bg-green-900/90 border-green-700 backdrop-blur-sm"
                : "bg-green-50 border-green-300"
              : notification.type === "error"
              ? darkMode
                ? "bg-red-900/90 border-red-700 backdrop-blur-sm"
                : "bg-red-50 border-red-300"
              : darkMode
              ? "bg-blue-900/90 border-blue-700 backdrop-blur-sm"
              : "bg-blue-50 border-blue-300"
          }`}
        >
          <div className="flex-shrink-0">
            {notification.type === "success" ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={darkMode ? "#4ade80" : "#16a34a"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : notification.type === "error" ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={darkMode ? "#f87171" : "#dc2626"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={darkMode ? "#60a5fa" : "#2563eb"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold ${
                notification.type === "success"
                  ? darkMode
                    ? "text-green-400"
                    : "text-green-800"
                  : notification.type === "error"
                  ? darkMode
                    ? "text-red-400"
                    : "text-red-800"
                  : darkMode
                  ? "text-blue-400"
                  : "text-blue-800"
              }`}
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
              notification.type === "success"
                ? darkMode
                  ? "hover:bg-green-800/50 text-green-400"
                  : "hover:bg-green-200 text-green-600"
                : notification.type === "error"
                ? darkMode
                  ? "hover:bg-red-800/50 text-red-400"
                  : "hover:bg-red-200 text-red-600"
                : darkMode
                ? "hover:bg-blue-800/50 text-blue-400"
                : "hover:bg-blue-200 text-blue-600"
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-3xl font-bold flex items-center gap-3 ${
              darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
            }`}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Projects
          </h1>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mt-2`}>
            Manage your annotation projects
          </p>
        </div>
      </div>

      {/* Manager: Create Project Card */}
      {user?.role === "manager" && (
        <div
          className={`rounded-2xl border-2 shadow-lg p-6 ${
            darkMode
              ? "bg-purple-950/30 border-purple-700"
              : "bg-purple-50 border-purple-200"
          }`}
        >
          <h2
            className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Project
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
                }`}
              >
                Project Name
              </label>
              <input
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                  darkMode
                    ? "dark:border-gray-600 dark:text-[#D78FEE] dark:bg-gray-800 dark:placeholder:text-gray-500 focus:border-[#D78FEE]"
                    : "border-gray-200 text-[#2E073F] bg-white placeholder:text-gray-400 focus:border-[#7A1CAC]"
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q3 Sentiment Analysis"
                required
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
                }`}
              >
                Category
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                  darkMode
                    ? "dark:border-gray-600 dark:text-[#D78FEE] dark:bg-gray-800 focus:border-[#D78FEE]"
                    : "border-gray-200 text-[#2E073F] bg-white focus:border-[#7A1CAC]"
                }`}
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
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#7A1CAC] to-[#9D4EDD] hover:from-[#6A1A9C] hover:to-[#8D3ECD] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Project
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      {user?.role === "manager" && (
        <div
          className="flex gap-2 border-b-2"
          style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}
        >
          <button
            onClick={() => setActiveTab("running")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "running"
                ? darkMode
                  ? "text-[#D78FEE] border-b-2 border-[#D78FEE]"
                  : "text-[#7A1CAC] border-b-2 border-[#7A1CAC]"
                : darkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Running Projects ({runningProjects.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "completed"
                ? darkMode
                  ? "text-[#D78FEE] border-b-2 border-[#D78FEE]"
                  : "text-[#7A1CAC] border-b-2 border-[#7A1CAC]"
                : darkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Completed Projects ({completedProjects.length})
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {displayedProjects.length === 0 ? (
        <div
          className={`rounded-2xl border-2 shadow-md p-12 text-center ${
            darkMode
              ? "dark:bg-gray-800 dark:border-gray-700 dark:text-[#D78FEE]"
              : "bg-white border-gray-200 text-[#2E073F]"
          }`}
        >
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{
              backgroundColor: darkMode ? "rgba(124, 58, 237,0.2)" : "#EDE9FE",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={darkMode ? "#D78FEE" : "#7A1CAC"}
              strokeWidth="2"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div
            className={`text-xl font-semibold mb-2 ${
              darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
            }`}
          >
            No projects yet
          </div>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            {user?.role === "manager"
              ? activeTab === "running"
                ? "Create a new project to get started"
                : "No completed projects yet"
              : "You'll see projects here once you're invited"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((p) => (
            <Link
              key={p.id}
              to={
                user?.role === "manager" || acceptedProjectIds.has(p.id)
                  ? `/projects/${p.id}`
                  : "#"
              }
              className={`p-6 rounded-2xl border shadow-md transition-all ${
                user?.role === "manager" || acceptedProjectIds.has(p.id)
                  ? "cursor-pointer hover:shadow-lg"
                  : "cursor-default"
              } ${
                darkMode
                  ? "bg-gray-800 border-purple-700"
                  : "bg-white border-purple-300"
              }`}
              onClick={(e: React.MouseEvent) => {
                if (user?.role !== "manager" && !acceptedProjectIds.has(p.id)) {
                  e.preventDefault();
                }
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`p-2 rounded-xl ${
                      darkMode ? "bg-purple-900/30" : "bg-purple-100"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={darkMode ? "#D78FEE" : "#7A1CAC"}
                      strokeWidth="2"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className={`font-bold text-lg ${
                          darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
                        }`}
                      >
                        {p.details || p.id}
                      </h3>
                      {p.is_completed && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                            darkMode
                              ? "bg-green-900/40 text-green-400"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        darkMode
                          ? "bg-purple-900/40 text-[#D78FEE]"
                          : "bg-purple-100 text-[#7A1CAC]"
                      }`}
                    >
                      {CATEGORIES.find((c) => c.value === p.category)?.label ||
                        p.category}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                {user?.role === "manager" || user?.role === "admin" ? (
                  <div className="mt-auto pt-4 space-y-2">
                    <div
                      className="flex gap-3 pb-2 border-b"
                      style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}
                    >
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        {taskCounts.get(p.id) ?? "..."} tasks
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {user?.role === "manager" && (
                      <div className="flex gap-2">
                        {p.is_completed ? (
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReopenConfirmModal({
                                projectId: p.id,
                                projectName: p.details || p.id,
                              });
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                              darkMode
                                ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            ↻ Reopen
                          </button>
                        ) : (
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCompleteConfirmModal({
                                projectId: p.id,
                                projectName: p.details || p.id,
                              });
                            }}
                            disabled={completingId === p.id}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                              completingId === p.id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            } ${
                              darkMode
                                ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {completingId === p.id ? "..." : "✓ Mark Complete"}
                          </button>
                        )}
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirmModal({
                              projectId: p.id,
                              projectName: p.details || p.id,
                            });
                          }}
                          disabled={deletingId === p.id}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                            deletingId === p.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          } ${
                            darkMode
                              ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {deletingId === p.id ? "..." : "🗑"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="mt-auto pt-4 border-t flex items-center justify-start gap-2"
                    style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}
                  >
                    {!acceptedProjectIds.has(p.id) && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${
                          darkMode
                            ? "bg-orange-900/20 border-orange-800 text-orange-400"
                            : "bg-orange-50 border-orange-200 text-orange-600"
                        }`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="6" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Pending invite
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
