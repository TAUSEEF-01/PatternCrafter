import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetch } from "@/api/client";
import { useTheme } from "@/components/NavBar";
import Card from "@/components/ui/Card";

// Extend minimal user shape locally to include optional skills
type Me = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "annotator" | string;
  skills?: string[];
  paid?: boolean;
};

interface WorkStats {
  total_hours: {
    annotation: number;
    qa: number;
    total: number;
  };
  this_week: {
    annotation: number;
    qa: number;
    total: number;
  };
  this_month: {
    annotation: number;
    qa: number;
    total: number;
  };
  tasks_completed: {
    annotation: number;
    qa: number;
  };
  tasks_assigned: {
    annotation: number;
    qa: number;
  };
  weekly_data: Array<{
    date: string;
    day: string;
    annotation_hours: number;
    qa_hours: number;
    total_hours: number;
  }>;
  monthly_data: Array<{
    date: string;
    annotation_hours: number;
    qa_hours: number;
    total_hours: number;
  }>;
}

// Predefined skill options
const PROGRAMMING_LANGUAGES = [
  "Python",
  "Java",
  "C++",
  "C",
  "JavaScript",
  "TypeScript",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "C#",
  "Scala",
  "R",
  "MATLAB",
  "SQL",
];

const ANNOTATION_SKILLS = [
  "Text Classification",
  "Named Entity Recognition (NER)",
  "Sentiment Analysis",
  "Image Classification",
  "Object Detection",
  "Image Segmentation",
  "Bounding Box Annotation",
  "Semantic Segmentation",
  "Keypoint Annotation",
  "Video Annotation",
  "Audio Transcription",
  "Audio Classification",
  "Text Summarization",
  "Question Answering (QA)",
  "Translation",
  "Data Labeling",
  "Quality Assurance",
  "Bengali Language",
  "English Language",
  "Multi-lingual Annotation",
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [selectedProgrammingLangs, setSelectedProgrammingLangs] = useState<
    string[]
  >([]);
  const [selectedAnnotationSkills, setSelectedAnnotationSkills] = useState<
    string[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [workStats, setWorkStats] = useState<WorkStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartView, setChartView] = useState<"week" | "month">("week");
  const [invites, setInvites] = useState<
    {
      id: string;
      project_id: string;
      accepted_status: boolean;
      invited_at?: string;
      accepted_at?: string | null;
    }[]
  >([]);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [invBusy, setInvBusy] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const m = await apiFetch<Me>("/auth/me");
        setMe(m);
        // Parse existing skills into programming languages and annotation skills
        const skills = m.skills || [];
        setSelectedProgrammingLangs(
          skills.filter((s) => PROGRAMMING_LANGUAGES.includes(s))
        );
        setSelectedAnnotationSkills(
          skills.filter((s) => ANNOTATION_SKILLS.includes(s))
        );

        // Load work stats for annotators
        if (m.role === "annotator") {
          setStatsLoading(true);
          try {
            const stats = await apiFetch<WorkStats>("/users/me/work-stats");
            setWorkStats(stats);
          } catch (e) {
            console.error("Failed to load work stats:", e);
          } finally {
            setStatsLoading(false);
          }
        }
      } catch (e: any) {
        setMsg(e?.message || "Failed to load profile");
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadInvites() {
      try {
        const list = await apiFetch<any[]>("/invites");
        setInvites(list);
      } catch (e: any) {
        setInvitesError(e?.message || "Failed to load invites");
      }
    }
    if (user) loadInvites();
  }, [user]);

  const toggleProgrammingLang = (lang: string) => {
    setSelectedProgrammingLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleAnnotationSkill = (skill: string) => {
    setSelectedAnnotationSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const saveSkills = async () => {
    if (!me) return;
    setSaving(true);
    setMsg(null);
    try {
      // Combine both skill categories
      const skills = [...selectedProgrammingLangs, ...selectedAnnotationSkills];
      const updated = await apiFetch<Me>("/users/me/skills", {
        method: "PUT",
        body: { skills },
      });
      setMe(updated);
      setMsg("Skills updated successfully!");
    } catch (e: any) {
      setMsg(e?.message || "Failed to update skills");
    } finally {
      setSaving(false);
    }
  };

  const acceptInvite = async (id: string) => {
    setInvBusy(id);
    setInvitesError(null);
    try {
      await apiFetch(`/invites/${id}/accept`, { method: "PUT" });
      setInvites((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                accepted_status: true,
                accepted_at: new Date().toISOString(),
              }
            : i
        )
      );
    } catch (e: any) {
      setInvitesError(e?.message || "Failed to accept invite");
    } finally {
      setInvBusy(null);
    }
  };

  if (!user) return null;

  const { darkMode } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Manage your account information and preferences
        </p>
      </div>

      <Card className="p-6">
        <h2
          className={`text-xl font-bold mb-6 ${
            darkMode ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Account Information
        </h2>
        <div className="space-y-4">
          <div
            className={`flex items-center gap-4 p-3 rounded-lg ${
              darkMode ? "bg-slate-700/50" : "bg-gray-50"
            }`}
          >
            <span
              className={`font-semibold w-24 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Name:
            </span>
            <span
              className={`font-medium ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {me?.name}
            </span>
          </div>
          <div
            className={`flex items-center gap-4 p-3 rounded-lg ${
              darkMode ? "bg-slate-700/50" : "bg-gray-50"
            }`}
          >
            <span
              className={`font-semibold w-24 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email:
            </span>
            <span
              className={`font-medium ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {me?.email}
            </span>
          </div>
          <div
            className={`flex items-center gap-4 p-3 rounded-lg ${
              darkMode ? "bg-slate-700/50" : "bg-gray-50"
            }`}
          >
            <span
              className={`font-semibold w-24 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Role:
            </span>
            <span className="badge badge-primary capitalize">{me?.role}</span>
          </div>
        </div>
      </Card>

      {/* Work Statistics for Annotators */}
      {me?.role === "annotator" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-bold ${
                  darkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                ⏱️ Work Statistics
              </h2>
              {workStats && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView("week")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      chartView === "week"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setChartView("month")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      chartView === "month"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        : darkMode
                        ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    This Month
                  </button>
                </div>
              )}
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <svg
                    className="animate-spin h-6 w-6 text-indigo-600"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span
                    className={darkMode ? "text-gray-300" : "text-gray-600"}
                  >
                    Loading statistics...
                  </span>
                </div>
              </div>
            ) : workStats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <div className="text-white/80 text-sm font-medium">
                      Total Hours
                    </div>
                    <div className="text-white text-3xl font-bold mt-1">
                      {workStats.total_hours.total}h
                    </div>
                    <div className="text-white/60 text-xs mt-2">
                      📝 {workStats.total_hours.annotation}h annotation • ✅{" "}
                      {workStats.total_hours.qa}h QA
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #14b8a6)",
                      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <div className="text-white/80 text-sm font-medium">
                      This Week
                    </div>
                    <div className="text-white text-3xl font-bold mt-1">
                      {workStats.this_week.total}h
                    </div>
                    <div className="text-white/60 text-xs mt-2">
                      📝 {workStats.this_week.annotation}h annotation • ✅{" "}
                      {workStats.this_week.qa}h QA
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #f97316)",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <div className="text-white/80 text-sm font-medium">
                      This Month
                    </div>
                    <div className="text-white text-3xl font-bold mt-1">
                      {workStats.this_month.total}h
                    </div>
                    <div className="text-white/60 text-xs mt-2">
                      📝 {workStats.this_month.annotation}h annotation • ✅{" "}
                      {workStats.this_month.qa}h QA
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <div className="text-white/80 text-sm font-medium">
                      Tasks Completed
                    </div>
                    <div className="text-white text-3xl font-bold mt-1">
                      {workStats.tasks_completed.annotation +
                        workStats.tasks_completed.qa}
                    </div>
                    <div className="text-white/60 text-xs mt-2">
                      📝 {workStats.tasks_completed.annotation} annotation • ✅{" "}
                      {workStats.tasks_completed.qa} QA
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div
                  className={`rounded-xl p-5 ${
                    darkMode ? "bg-slate-700/50" : "bg-gray-50"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold mb-4 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {chartView === "week"
                      ? "Hours Worked This Week"
                      : "Hours Worked This Month"}
                  </h3>

                  {chartView === "week" ? (
                    <div className="space-y-3">
                      {workStats.weekly_data.map((day) => {
                        const maxHours = Math.max(
                          ...workStats.weekly_data.map((d) => d.total_hours),
                          1
                        );
                        const annotationWidth =
                          (day.annotation_hours / maxHours) * 100;
                        const qaWidth = (day.qa_hours / maxHours) * 100;

                        return (
                          <div
                            key={day.date}
                            className="flex items-center gap-3"
                          >
                            <div
                              className={`w-10 text-sm font-medium ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {day.day}
                            </div>
                            <div
                              className="flex-1 h-8 rounded-lg overflow-hidden flex"
                              style={{
                                backgroundColor: darkMode
                                  ? "#334155"
                                  : "#e2e8f0",
                              }}
                            >
                              {day.annotation_hours > 0 && (
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${annotationWidth}%`,
                                    background:
                                      "linear-gradient(90deg, #6366f1, #8b5cf6)",
                                  }}
                                  title={`Annotation: ${day.annotation_hours}h`}
                                />
                              )}
                              {day.qa_hours > 0 && (
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${qaWidth}%`,
                                    background:
                                      "linear-gradient(90deg, #10b981, #14b8a6)",
                                  }}
                                  title={`QA: ${day.qa_hours}h`}
                                />
                              )}
                            </div>
                            <div
                              className={`w-16 text-sm text-right font-medium ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {day.total_hours}h
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      {/* Check if there's any data */}
                      {workStats.monthly_data.every(
                        (d) => d.total_hours === 0
                      ) ? (
                        <div
                          className={`h-48 flex items-center justify-center ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-2">📊</div>
                            <p className="text-sm">
                              No hours recorded this month yet
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 flex items-end gap-1">
                          {workStats.monthly_data.map((day) => {
                            const maxHours = Math.max(
                              ...workStats.monthly_data.map(
                                (d) => d.total_hours
                              ),
                              0.1
                            );
                            const heightPercent =
                              (day.total_hours / maxHours) * 100;

                            return (
                              <div
                                key={day.date}
                                className="flex-1 flex flex-col justify-end group relative"
                                style={{ minWidth: "6px" }}
                              >
                                {day.total_hours > 0 ? (
                                  <div
                                    className="w-full rounded-t transition-all duration-300 cursor-pointer hover:opacity-80 flex flex-col"
                                    style={{
                                      height: `${Math.max(heightPercent, 8)}%`,
                                      minHeight: "8px",
                                      background:
                                        day.qa_hours > 0 &&
                                        day.annotation_hours > 0
                                          ? `linear-gradient(to top, #10b981 ${
                                              (day.qa_hours / day.total_hours) *
                                              100
                                            }%, #6366f1 ${
                                              (day.qa_hours / day.total_hours) *
                                              100
                                            }%)`
                                          : day.annotation_hours > 0
                                          ? "linear-gradient(180deg, #6366f1, #8b5cf6)"
                                          : "linear-gradient(180deg, #10b981, #14b8a6)",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="w-full rounded-t"
                                    style={{
                                      height: "2px",
                                      backgroundColor: darkMode
                                        ? "#475569"
                                        : "#d1d5db",
                                    }}
                                  />
                                )}
                                {/* Tooltip */}
                                <div
                                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                                    darkMode
                                      ? "bg-gray-800 text-white"
                                      : "bg-gray-900 text-white"
                                  }`}
                                  style={{
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                  }}
                                >
                                  {new Date(day.date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" }
                                  )}
                                  <br />
                                  {day.total_hours > 0 ? (
                                    <>
                                      {day.total_hours}h total
                                      {day.annotation_hours > 0 && (
                                        <>
                                          <br />
                                          📝 {day.annotation_hours}h
                                        </>
                                      )}
                                      {day.qa_hours > 0 && (
                                        <>
                                          <br />✅ {day.qa_hours}h
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    "No hours"
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* X-axis labels */}
                      {!workStats.monthly_data.every(
                        (d) => d.total_hours === 0
                      ) && (
                        <div className="flex justify-between mt-2 px-1">
                          <span
                            className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {new Date(
                              workStats.monthly_data[0]?.date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span
                            className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {new Date(
                              workStats.monthly_data[
                                workStats.monthly_data.length - 1
                              ]?.date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legend */}
                  <div
                    className="flex items-center justify-center gap-6 mt-4 pt-4 border-t"
                    style={{ borderColor: darkMode ? "#475569" : "#d1d5db" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                      />
                      <span
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Annotation
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981, #14b8a6)",
                        }}
                      />
                      <span
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        QA Review
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                className={`text-center py-12 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No work statistics available yet. Start completing tasks to see
                your progress!
              </div>
            )}
          </div>
        </Card>
      )}

      {me?.role === "annotator" && (
        <Card className="p-6">
          <div className="space-y-6">
            <h2
              className={`text-xl font-bold ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Skills & Expertise
            </h2>

            {/* Programming Languages */}
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Programming Languages
              </label>
              <p
                className={`text-sm mb-4 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Select all programming languages you're proficient in
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleProgrammingLang(lang)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedProgrammingLangs.includes(lang)
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        : darkMode
                        ? "bg-slate-700/50 text-gray-300 hover:bg-slate-600 border border-slate-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Annotation Skills */}
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Annotation Skills
              </label>
              <p
                className={`text-sm mb-4 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Select all annotation tasks you can perform
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ANNOTATION_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleAnnotationSkill(skill)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      selectedAnnotationSkills.includes(skill)
                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        : darkMode
                        ? "bg-slate-700/50 text-gray-300 hover:bg-slate-600 border border-slate-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Skills Summary */}
            <div
              className={`rounded-xl p-5 ${
                darkMode ? "bg-slate-700/50" : "bg-gray-50"
              }`}
            >
              <h3
                className={`text-sm font-semibold mb-3 ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Selected Skills (
                {selectedProgrammingLangs.length +
                  selectedAnnotationSkills.length}
                )
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedProgrammingLangs.map((lang) => (
                  <span key={lang} className="badge badge-primary">
                    {lang}
                  </span>
                ))}
                {selectedAnnotationSkills.map((skill) => (
                  <span key={skill} className="badge badge-green">
                    {skill}
                  </span>
                ))}
                {selectedProgrammingLangs.length === 0 &&
                  selectedAnnotationSkills.length === 0 && (
                    <span
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No skills selected yet
                    </span>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                disabled={saving}
                onClick={saveSkills}
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Skills"
                )}
              </button>
              {msg && (
                <span
                  className={`text-sm font-medium ${
                    msg.includes("success")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {msg}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {me?.role === "annotator" && (
        <Card className="p-6">
          <div className="space-y-4">
            <h2
              className={`text-xl font-bold ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              My Invites
            </h2>
            {invitesError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                {invitesError}
              </div>
            )}
            {invites.length === 0 ? (
              <p
                className={`text-center py-12 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No invites yet
              </p>
            ) : (
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-200 hover:shadow-lg ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Project:</span>
                        <span className="text-sm font-mono text-gray-600">
                          {inv.project_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Invited:{" "}
                        {inv.invited_at
                          ? new Date(inv.invited_at).toLocaleString()
                          : "-"}
                      </div>
                      <div className="text-sm">
                        {inv.accepted_status ? (
                          <span className="badge badge-green">
                            Accepted{" "}
                            {inv.accepted_at
                              ? new Date(inv.accepted_at).toLocaleString()
                              : ""}
                          </span>
                        ) : (
                          <span className="badge badge-yellow">Pending</span>
                        )}
                      </div>
                    </div>
                    {!inv.accepted_status ? (
                      <button
                        disabled={invBusy === inv.id}
                        onClick={() => acceptInvite(inv.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {invBusy === inv.id ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Accepting...
                          </span>
                        ) : (
                          "Accept"
                        )}
                      </button>
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        ✓ Accepted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
