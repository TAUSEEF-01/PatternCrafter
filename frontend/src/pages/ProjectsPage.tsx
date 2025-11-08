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

  useEffect(() => {
    apiFetch<Project[]>("/projects")
      .then(setProjects)
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

  return (
    <div className="space-y-6 p-6">
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

      {/* Projects Grid */}
      {projects.length === 0 ? (
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
              ? "Create a new project to get started"
              : "You'll see projects here once you're invited"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`p-6 rounded-2xl border shadow-md transition-all cursor-pointer ${
                darkMode
                  ? "bg-gray-800 border-purple-700 hover:shadow-lg"
                  : "bg-white border-purple-300 hover:shadow-lg"
              }`}
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
                    <h3
                      className={`font-bold text-lg mb-2 ${
                        darkMode ? "text-[#D78FEE]" : "text-[#2E073F]"
                      }`}
                    >
                      {p.details || p.id}
                    </h3>
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
                  <div
                    className="flex gap-3 mt-auto pt-4 border-t"
                    style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}
                  >
                    <Link
                      className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                        darkMode
                          ? "text-[#D78FEE] hover:text-[#EAB4FF]"
                          : "text-[#7A1CAC] hover:text-[#9D4EDD]"
                      }`}
                      to={`/projects/${p.id}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      Open
                    </Link>
                    <Link
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                        darkMode
                          ? "text-gray-300 hover:text-[#D78FEE]"
                          : "text-gray-600 hover:text-[#2E073F]"
                      }`}
                      to={`/projects/${p.id}/invites`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Invites
                    </Link>
                  </div>
                ) : (
                  <div
                    className="mt-auto pt-4 border-t flex items-center justify-start gap-2"
                    style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}
                  >
                    {acceptedProjectIds.has(p.id) ? (
                      <Link
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          darkMode
                            ? "text-[#D78FEE] hover:text-[#EAB4FF]"
                            : "text-[#7A1CAC] hover:text-[#9D4EDD]"
                        }`}
                        to={`/projects/${p.id}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 7v13h18V7H3z" />
                          <polyline points="9 12 12 15 15 12" />
                        </svg>
                        Open
                      </Link>
                    ) : (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
