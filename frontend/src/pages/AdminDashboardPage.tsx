import { useEffect, useState } from "react";
import { useTheme } from "@/components/NavBar";
import { apiFetch } from "@/api/client";

interface AdminStats {
  total_managers: number;
  total_annotators: number;
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

interface ManagerWithStats {
  id: string;
  name: string;
  email: string;
  role: string;
  project_count: number;
  total_tasks: number;
  completed_tasks: number;
  created_at?: string;
}

interface AnnotatorWithStats {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  assigned_tasks: number;
  completed_tasks: number;
  qa_tasks: number;
  qa_completed: number;
  invited_projects: number;
  created_at?: string;
}

interface ProjectWithStats {
  id: string;
  details: string;
  category: string;
  manager_id: string;
  manager_name: string;
  total_tasks: number;
  completed_tasks: number;
  invited_annotators: number;
  created_at?: string;
  is_completed: boolean;
}

interface UserForAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  paid?: boolean;
  project_count?: number;
  created_at?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface DailyGrowthData {
  date: string;
  tasks_created: number;
  managers_registered: number;
  annotators_registered: number;
  cumulative_tasks: number;
  cumulative_managers: number;
  cumulative_annotators: number;
}

interface WeeklyGrowthData {
  week_start: string;
  week_end: string;
  week_label: string;
  tasks_created: number;
  managers_registered: number;
  annotators_registered: number;
}

interface GrowthData {
  daily_data: DailyGrowthData[];
  weekly_data: WeeklyGrowthData[];
  totals: {
    tasks: number;
    managers: number;
    annotators: number;
  };
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  type,
  onConfirm,
  onCancel,
  darkMode,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: "🛡️",
      gradient: "linear-gradient(135deg, #ef4444, #f97316)",
      buttonBg: darkMode ? "#dc2626" : "#ef4444",
      buttonHover: darkMode ? "#b91c1c" : "#dc2626",
    },
    warning: {
      icon: "⚠️",
      gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
      buttonBg: darkMode ? "#d97706" : "#f59e0b",
      buttonHover: darkMode ? "#b45309" : "#d97706",
    },
    info: {
      icon: "👑",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      buttonBg: darkMode ? "#6366f1" : "#4f46e5",
      buttonHover: darkMode ? "#4f46e5" : "#4338ca",
    },
  };

  const style = typeStyles[type];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          borderRadius: "1rem",
          padding: "0",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
          animation: "slideUp 0.3s ease-out",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div
          style={{
            background: style.gradient,
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "0.5rem",
            }}
          >
            {style.icon}
          </div>
          <h3
            style={{
              color: "#ffffff",
              fontSize: "1.25rem",
              fontWeight: "700",
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem" }}>
          <p
            style={{
              color: darkMode ? "#cbd5e1" : "#475569",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              textAlign: "center",
              margin: 0,
            }}
          >
            {message}
          </p>
        </div>

        {/* Footer with buttons */}
        <div
          style={{
            padding: "1rem 1.5rem 1.5rem",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: `1px solid ${darkMode ? "#475569" : "#cbd5e1"}`,
              backgroundColor: "transparent",
              color: darkMode ? "#94a3b8" : "#64748b",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode
                ? "#334155"
                : "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: style.buttonBg,
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = style.buttonHover;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = style.buttonBg;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

type TabType = "overview" | "managers" | "annotators" | "projects" | "users";

export default function AdminDashboardPage() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [managers, setManagers] = useState<ManagerWithStats[]>([]);
  const [annotators, setAnnotators] = useState<AnnotatorWithStats[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [allUsers, setAllUsers] = useState<UserForAdmin[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [growthView, setGrowthView] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [demotingUserId, setDemotingUserId] = useState<string | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    type: "info",
    onConfirm: () => {},
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [
        statsData,
        managersData,
        annotatorsData,
        projectsData,
        usersData,
        adminsData,
        growthDataResult,
      ] = await Promise.all([
        apiFetch<AdminStats>("/admin/stats"),
        apiFetch<ManagerWithStats[]>("/admin/managers"),
        apiFetch<AnnotatorWithStats[]>("/admin/annotators"),
        apiFetch<ProjectWithStats[]>("/admin/projects"),
        apiFetch<UserForAdmin[]>("/admin/users"),
        apiFetch<AdminUser[]>("/admin/all-admins"),
        apiFetch<GrowthData>("/admin/growth-data"),
      ]);
      setStats(statsData);
      setManagers(managersData);
      setAnnotators(annotatorsData);
      setProjects(projectsData);
      setAllUsers(usersData);
      setAdmins(adminsData);
      setGrowthData(growthDataResult);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }

  async function handlePromoteToAdmin(userId: string, userName: string) {
    setConfirmModal({
      isOpen: true,
      title: "Promote to Admin",
      message: `Are you sure you want to promote "${userName}" to admin? They will have full admin privileges including the ability to manage all users, view all projects, and promote other users.`,
      confirmText: "Yes, Promote",
      type: "info",
      onConfirm: async () => {
        closeModal();
        setPromotingUserId(userId);
        try {
          await apiFetch("/admin/promote-to-admin", {
            method: "POST",
            body: { user_id: userId },
          });
          await loadData();
        } catch (err: any) {
          setConfirmModal({
            isOpen: true,
            title: "Error",
            message: err.message || "Failed to promote user",
            confirmText: "OK",
            type: "danger",
            onConfirm: closeModal,
          });
        } finally {
          setPromotingUserId(null);
        }
      },
    });
  }

  async function handleDemoteFromAdmin(userId: string, userName: string) {
    setConfirmModal({
      isOpen: true,
      title: "Demote Admin",
      message: `Are you sure you want to demote "${userName}" from admin to manager? They will lose all admin privileges.`,
      confirmText: "Yes, Demote",
      type: "warning",
      onConfirm: async () => {
        closeModal();
        setDemotingUserId(userId);
        try {
          await apiFetch("/admin/demote-from-admin", {
            method: "POST",
            body: { user_id: userId },
          });
          await loadData();
        } catch (err: any) {
          setConfirmModal({
            isOpen: true,
            title: "Error",
            message: err.message || "Failed to demote admin",
            confirmText: "OK",
            type: "danger",
            onConfirm: closeModal,
          });
        } finally {
          setDemotingUserId(null);
        }
      },
    });
  }

  const cardStyle = {
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    borderRadius: "1rem",
    padding: "1.5rem",
    boxShadow: darkMode
      ? "0 4px 20px rgba(0, 0, 0, 0.3)"
      : "0 4px 20px rgba(0, 0, 0, 0.1)",
    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
  };

  const statCardStyle = (gradient: string) => ({
    ...cardStyle,
    background: darkMode
      ? `linear-gradient(135deg, ${gradient})`
      : `linear-gradient(135deg, ${gradient})`,
    color: "#ffffff",
  });

  const tabStyle = (isActive: boolean) => ({
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
    backgroundColor: isActive
      ? darkMode
        ? "#6366f1"
        : "#4f46e5"
      : darkMode
      ? "#334155"
      : "#e2e8f0",
    color: isActive ? "#ffffff" : darkMode ? "#94a3b8" : "#64748b",
  });

  const tableHeaderStyle = {
    padding: "1rem",
    textAlign: "left" as const,
    fontWeight: "600",
    borderBottom: `2px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
    color: darkMode ? "#e2e8f0" : "#1e293b",
  };

  const tableCellStyle = {
    padding: "1rem",
    borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
    color: darkMode ? "#cbd5e1" : "#475569",
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
          />
          <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          style={{
            ...cardStyle,
            backgroundColor: darkMode ? "#7f1d1d" : "#fef2f2",
            borderColor: "#ef4444",
          }}
        >
          <p style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}>{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
          Monitor platform statistics and manage users
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <button
          style={tabStyle(activeTab === "overview")}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          style={tabStyle(activeTab === "managers")}
          onClick={() => setActiveTab("managers")}
        >
          👔 Managers ({stats?.total_managers || 0})
        </button>
        <button
          style={tabStyle(activeTab === "annotators")}
          onClick={() => setActiveTab("annotators")}
        >
          ✍️ Annotators ({stats?.total_annotators || 0})
        </button>
        <button
          style={tabStyle(activeTab === "projects")}
          onClick={() => setActiveTab("projects")}
        >
          📁 Projects ({stats?.total_projects || 0})
        </button>
        <button
          style={tabStyle(activeTab === "users")}
          onClick={() => setActiveTab("users")}
        >
          👥 Manage Users ({allUsers.length + admins.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div style={statCardStyle("#6366f1, #8b5cf6")}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">👔</div>
                <div>
                  <div className="text-3xl font-bold">
                    {stats.total_managers}
                  </div>
                  <div className="text-sm opacity-80">Total Managers</div>
                </div>
              </div>
            </div>

            <div style={statCardStyle("#10b981, #14b8a6")}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">✍️</div>
                <div>
                  <div className="text-3xl font-bold">
                    {stats.total_annotators}
                  </div>
                  <div className="text-sm opacity-80">Total Annotators</div>
                </div>
              </div>
            </div>

            <div style={statCardStyle("#f59e0b, #f97316")}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">📁</div>
                <div>
                  <div className="text-3xl font-bold">
                    {stats.total_projects}
                  </div>
                  <div className="text-sm opacity-80">Total Projects</div>
                </div>
              </div>
            </div>

            <div style={statCardStyle("#3b82f6, #6366f1")}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">📝</div>
                <div>
                  <div className="text-3xl font-bold">{stats.total_tasks}</div>
                  <div className="text-sm opacity-80">Total Tasks</div>
                </div>
              </div>
            </div>

            <div style={statCardStyle("#22c55e, #16a34a")}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <div className="text-3xl font-bold">
                    {stats.completed_tasks}
                  </div>
                  <div className="text-sm opacity-80">Completed Tasks</div>
                </div>
              </div>
            </div>

            <div style={statCardStyle("#ef4444, #f97316")}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">⏳</div>
                <div>
                  <div className="text-3xl font-bold">
                    {stats.pending_tasks}
                  </div>
                  <div className="text-sm opacity-80">Pending Tasks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Progress Chart */}
          <div style={cardStyle} className="mb-8">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
            >
              Task Completion Progress
            </h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span
                  className="text-sm font-semibold"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  {stats.total_tasks > 0
                    ? Math.round(
                        (stats.completed_tasks / stats.total_tasks) * 100
                      )
                    : 0}
                  % Complete
                </span>
                <span
                  className="text-sm"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  {stats.completed_tasks} / {stats.total_tasks} tasks
                </span>
              </div>
              <div
                className="overflow-hidden h-4 rounded-full"
                style={{ backgroundColor: darkMode ? "#334155" : "#e2e8f0" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.total_tasks > 0
                        ? (stats.completed_tasks / stats.total_tasks) * 100
                        : 0
                    }%`,
                    background: "linear-gradient(90deg, #22c55e, #10b981)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={cardStyle}>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
              >
                Top Managers by Projects
              </h3>
              {managers
                .sort((a, b) => b.project_count - a.project_count)
                .slice(0, 5)
                .map((manager, index) => (
                  <div
                    key={manager.id}
                    className="flex items-center justify-between py-2"
                    style={{
                      borderBottom:
                        index < 4
                          ? `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                      >
                        {manager.name[0]?.toUpperCase()}
                      </div>
                      <span style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}>
                        {manager.name}
                      </span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                        color: darkMode ? "#a5b4fc" : "#6366f1",
                      }}
                    >
                      {manager.project_count} projects
                    </span>
                  </div>
                ))}
              {managers.length === 0 && (
                <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  No managers found
                </p>
              )}
            </div>

            <div style={cardStyle}>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
              >
                Top Annotators by Completed Tasks
              </h3>
              {annotators
                .sort((a, b) => b.completed_tasks - a.completed_tasks)
                .slice(0, 5)
                .map((annotator, index) => (
                  <div
                    key={annotator.id}
                    className="flex items-center justify-between py-2"
                    style={{
                      borderBottom:
                        index < 4
                          ? `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981, #14b8a6)",
                        }}
                      >
                        {annotator.name[0]?.toUpperCase()}
                      </div>
                      <span style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}>
                        {annotator.name}
                      </span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                        color: darkMode ? "#6ee7b7" : "#10b981",
                      }}
                    >
                      {annotator.completed_tasks} completed
                    </span>
                  </div>
                ))}
              {annotators.length === 0 && (
                <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  No annotators found
                </p>
              )}
            </div>
          </div>

          {/* Growth Charts Section */}
          {growthData && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
                >
                  📈 Platform Growth Analytics
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGrowthView("daily")}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: "none",
                      backgroundColor:
                        growthView === "daily"
                          ? darkMode
                            ? "#6366f1"
                            : "#4f46e5"
                          : darkMode
                          ? "#334155"
                          : "#e2e8f0",
                      color:
                        growthView === "daily"
                          ? "#ffffff"
                          : darkMode
                          ? "#94a3b8"
                          : "#64748b",
                    }}
                  >
                    Daily (30 days)
                  </button>
                  <button
                    onClick={() => setGrowthView("weekly")}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: "none",
                      backgroundColor:
                        growthView === "weekly"
                          ? darkMode
                            ? "#6366f1"
                            : "#4f46e5"
                          : darkMode
                          ? "#334155"
                          : "#e2e8f0",
                      color:
                        growthView === "weekly"
                          ? "#ffffff"
                          : darkMode
                          ? "#94a3b8"
                          : "#64748b",
                    }}
                  >
                    Weekly (12 weeks)
                  </button>
                </div>
              </div>

              {/* Tasks Growth Chart */}
              <div style={cardStyle} className="mb-6">
                <h4
                  className="text-lg font-semibold mb-4"
                  style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
                >
                  📝 Tasks Created Over Time
                </h4>
                <div
                  style={{
                    height: "200px",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: growthView === "daily" ? "2px" : "8px",
                    padding: "0 0.5rem",
                    position: "relative",
                  }}
                >
                  {growthView === "daily"
                    ? (() => {
                        const data = growthData.daily_data;
                        const maxValue = Math.max(
                          ...data.map((d) => d.tasks_created),
                          1
                        );
                        return data.map((day, index) => {
                          const height =
                            maxValue > 0
                              ? Math.max(
                                  (day.tasks_created / maxValue) * 100,
                                  day.tasks_created > 0 ? 5 : 0
                                )
                              : 0;
                          return (
                            <div
                              key={day.date}
                              style={{
                                flex: 1,
                                height: `${height}%`,
                                minHeight:
                                  day.tasks_created > 0 ? "8px" : "2px",
                                background:
                                  day.tasks_created > 0
                                    ? "linear-gradient(180deg, #3b82f6, #6366f1)"
                                    : darkMode
                                    ? "#334155"
                                    : "#e2e8f0",
                                borderRadius: "4px 4px 0 0",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                                position: "relative",
                              }}
                              title={`${new Date(day.date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}: ${day.tasks_created} task${
                                day.tasks_created !== 1 ? "s" : ""
                              }`}
                            />
                          );
                        });
                      })()
                    : (() => {
                        const data = growthData.weekly_data;
                        const maxValue = Math.max(
                          ...data.map((d) => d.tasks_created),
                          1
                        );
                        return data.map((week) => {
                          const height =
                            maxValue > 0
                              ? Math.max(
                                  (week.tasks_created / maxValue) * 100,
                                  week.tasks_created > 0 ? 5 : 0
                                )
                              : 0;
                          return (
                            <div
                              key={week.week_label}
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  height: `${height}%`,
                                  minHeight:
                                    week.tasks_created > 0 ? "8px" : "2px",
                                  background:
                                    week.tasks_created > 0
                                      ? "linear-gradient(180deg, #3b82f6, #6366f1)"
                                      : darkMode
                                      ? "#334155"
                                      : "#e2e8f0",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                }}
                                title={`${week.week_label}: ${
                                  week.tasks_created
                                } task${week.tasks_created !== 1 ? "s" : ""}`}
                              />
                            </div>
                          );
                        });
                      })()}
                </div>
                <div
                  className="flex justify-between mt-2 text-xs"
                  style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                >
                  {growthView === "daily" ? (
                    <>
                      <span>30 days ago</span>
                      <span>Today</span>
                    </>
                  ) : (
                    <>
                      <span>12 weeks ago</span>
                      <span>This week</span>
                    </>
                  )}
                </div>
              </div>

              {/* Users Growth Charts - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Managers Growth Chart */}
                <div style={cardStyle}>
                  <h4
                    className="text-lg font-semibold mb-4"
                    style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
                  >
                    👔 Managers Registered Over Time
                  </h4>
                  <div
                    style={{
                      height: "160px",
                      display: "flex",
                      alignItems: "flex-end",
                      gap: growthView === "daily" ? "2px" : "8px",
                      padding: "0 0.5rem",
                    }}
                  >
                    {growthView === "daily"
                      ? (() => {
                          const data = growthData.daily_data;
                          const maxValue = Math.max(
                            ...data.map((d) => d.managers_registered),
                            1
                          );
                          return data.map((day) => {
                            const height =
                              maxValue > 0
                                ? Math.max(
                                    (day.managers_registered / maxValue) * 100,
                                    day.managers_registered > 0 ? 5 : 0
                                  )
                                : 0;
                            return (
                              <div
                                key={day.date}
                                style={{
                                  flex: 1,
                                  height: `${height}%`,
                                  minHeight:
                                    day.managers_registered > 0 ? "8px" : "2px",
                                  background:
                                    day.managers_registered > 0
                                      ? "linear-gradient(180deg, #6366f1, #8b5cf6)"
                                      : darkMode
                                      ? "#334155"
                                      : "#e2e8f0",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                }}
                                title={`${new Date(day.date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}: ${day.managers_registered} manager${
                                  day.managers_registered !== 1 ? "s" : ""
                                }`}
                              />
                            );
                          });
                        })()
                      : (() => {
                          const data = growthData.weekly_data;
                          const maxValue = Math.max(
                            ...data.map((d) => d.managers_registered),
                            1
                          );
                          return data.map((week) => {
                            const height =
                              maxValue > 0
                                ? Math.max(
                                    (week.managers_registered / maxValue) * 100,
                                    week.managers_registered > 0 ? 5 : 0
                                  )
                                : 0;
                            return (
                              <div
                                key={week.week_label}
                                style={{
                                  flex: 1,
                                  height: `${height}%`,
                                  minHeight:
                                    week.managers_registered > 0
                                      ? "8px"
                                      : "2px",
                                  background:
                                    week.managers_registered > 0
                                      ? "linear-gradient(180deg, #6366f1, #8b5cf6)"
                                      : darkMode
                                      ? "#334155"
                                      : "#e2e8f0",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                }}
                                title={`${week.week_label}: ${
                                  week.managers_registered
                                } manager${
                                  week.managers_registered !== 1 ? "s" : ""
                                }`}
                              />
                            );
                          });
                        })()}
                  </div>
                  <div
                    className="flex justify-between mt-2 text-xs"
                    style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                  >
                    {growthView === "daily" ? (
                      <>
                        <span>30 days ago</span>
                        <span>Today</span>
                      </>
                    ) : (
                      <>
                        <span>12 weeks ago</span>
                        <span>This week</span>
                      </>
                    )}
                  </div>
                  <div
                    className="mt-3 text-center text-sm"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    Total:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }}
                    >
                      {growthData.totals.managers}
                    </span>{" "}
                    managers
                  </div>
                </div>

                {/* Annotators Growth Chart */}
                <div style={cardStyle}>
                  <h4
                    className="text-lg font-semibold mb-4"
                    style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
                  >
                    ✍️ Annotators Registered Over Time
                  </h4>
                  <div
                    style={{
                      height: "160px",
                      display: "flex",
                      alignItems: "flex-end",
                      gap: growthView === "daily" ? "2px" : "8px",
                      padding: "0 0.5rem",
                    }}
                  >
                    {growthView === "daily"
                      ? (() => {
                          const data = growthData.daily_data;
                          const maxValue = Math.max(
                            ...data.map((d) => d.annotators_registered),
                            1
                          );
                          return data.map((day) => {
                            const height =
                              maxValue > 0
                                ? Math.max(
                                    (day.annotators_registered / maxValue) *
                                      100,
                                    day.annotators_registered > 0 ? 5 : 0
                                  )
                                : 0;
                            return (
                              <div
                                key={day.date}
                                style={{
                                  flex: 1,
                                  height: `${height}%`,
                                  minHeight:
                                    day.annotators_registered > 0
                                      ? "8px"
                                      : "2px",
                                  background:
                                    day.annotators_registered > 0
                                      ? "linear-gradient(180deg, #10b981, #14b8a6)"
                                      : darkMode
                                      ? "#334155"
                                      : "#e2e8f0",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                }}
                                title={`${new Date(day.date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}: ${day.annotators_registered} annotator${
                                  day.annotators_registered !== 1 ? "s" : ""
                                }`}
                              />
                            );
                          });
                        })()
                      : (() => {
                          const data = growthData.weekly_data;
                          const maxValue = Math.max(
                            ...data.map((d) => d.annotators_registered),
                            1
                          );
                          return data.map((week) => {
                            const height =
                              maxValue > 0
                                ? Math.max(
                                    (week.annotators_registered / maxValue) *
                                      100,
                                    week.annotators_registered > 0 ? 5 : 0
                                  )
                                : 0;
                            return (
                              <div
                                key={week.week_label}
                                style={{
                                  flex: 1,
                                  height: `${height}%`,
                                  minHeight:
                                    week.annotators_registered > 0
                                      ? "8px"
                                      : "2px",
                                  background:
                                    week.annotators_registered > 0
                                      ? "linear-gradient(180deg, #10b981, #14b8a6)"
                                      : darkMode
                                      ? "#334155"
                                      : "#e2e8f0",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                }}
                                title={`${week.week_label}: ${
                                  week.annotators_registered
                                } annotator${
                                  week.annotators_registered !== 1 ? "s" : ""
                                }`}
                              />
                            );
                          });
                        })()}
                  </div>
                  <div
                    className="flex justify-between mt-2 text-xs"
                    style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                  >
                    {growthView === "daily" ? (
                      <>
                        <span>30 days ago</span>
                        <span>Today</span>
                      </>
                    ) : (
                      <>
                        <span>12 weeks ago</span>
                        <span>This week</span>
                      </>
                    )}
                  </div>
                  <div
                    className="mt-3 text-center text-sm"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    Total:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: darkMode ? "#6ee7b7" : "#10b981" }}
                    >
                      {growthData.totals.annotators}
                    </span>{" "}
                    annotators
                  </div>
                </div>
              </div>

              {/* Cumulative Growth Line Chart */}
              <div style={cardStyle} className="mt-6">
                <h4
                  className="text-lg font-semibold mb-4"
                  style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
                >
                  📊 Cumulative Growth (Last 30 Days)
                </h4>
                <div
                  style={{
                    height: "200px",
                    position: "relative",
                    padding: "0 1rem",
                  }}
                >
                  {/* Simple area chart visualization */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 300 180"
                    preserveAspectRatio="none"
                  >
                    {(() => {
                      const data = growthData.daily_data;
                      const maxTasks = Math.max(
                        ...data.map((d) => d.cumulative_tasks),
                        1
                      );
                      const maxManagers = Math.max(
                        ...data.map((d) => d.cumulative_managers),
                        1
                      );
                      const maxAnnotators = Math.max(
                        ...data.map((d) => d.cumulative_annotators),
                        1
                      );
                      const overallMax = Math.max(
                        maxTasks,
                        maxManagers,
                        maxAnnotators
                      );

                      const getY = (value: number) =>
                        170 - (value / overallMax) * 160;
                      const getX = (index: number) =>
                        (index / (data.length - 1)) * 290 + 5;

                      // Generate paths for each line
                      const tasksPath = data
                        .map(
                          (d, i) =>
                            `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(
                              d.cumulative_tasks
                            )}`
                        )
                        .join(" ");

                      const managersPath = data
                        .map(
                          (d, i) =>
                            `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(
                              d.cumulative_managers
                            )}`
                        )
                        .join(" ");

                      const annotatorsPath = data
                        .map(
                          (d, i) =>
                            `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(
                              d.cumulative_annotators
                            )}`
                        )
                        .join(" ");

                      return (
                        <>
                          {/* Grid lines */}
                          <line
                            x1="5"
                            y1="10"
                            x2="5"
                            y2="170"
                            stroke={darkMode ? "#334155" : "#e2e8f0"}
                            strokeWidth="1"
                          />
                          <line
                            x1="5"
                            y1="170"
                            x2="295"
                            y2="170"
                            stroke={darkMode ? "#334155" : "#e2e8f0"}
                            strokeWidth="1"
                          />
                          <line
                            x1="5"
                            y1="90"
                            x2="295"
                            y2="90"
                            stroke={darkMode ? "#334155" : "#e2e8f0"}
                            strokeWidth="0.5"
                            strokeDasharray="4"
                          />

                          {/* Tasks line (blue) */}
                          <path
                            d={tasksPath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Managers line (purple) */}
                          <path
                            d={managersPath}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Annotators line (green) */}
                          <path
                            d={annotatorsPath}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: "16px",
                        height: "4px",
                        backgroundColor: "#3b82f6",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span
                      style={{
                        color: darkMode ? "#94a3b8" : "#64748b",
                        fontSize: "0.875rem",
                      }}
                    >
                      Tasks ({growthData.totals.tasks})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: "16px",
                        height: "4px",
                        backgroundColor: "#8b5cf6",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span
                      style={{
                        color: darkMode ? "#94a3b8" : "#64748b",
                        fontSize: "0.875rem",
                      }}
                    >
                      Managers ({growthData.totals.managers})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: "16px",
                        height: "4px",
                        backgroundColor: "#10b981",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span
                      style={{
                        color: darkMode ? "#94a3b8" : "#64748b",
                        fontSize: "0.875rem",
                      }}
                    >
                      Annotators ({growthData.totals.annotators})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Managers Tab */}
      {activeTab === "managers" && (
        <div style={cardStyle} className="overflow-x-auto">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
          >
            All Managers
          </h3>
          <table className="w-full">
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Manager</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Projects</th>
                <th style={tableHeaderStyle}>Total Tasks</th>
                <th style={tableHeaderStyle}>Completed</th>
                <th style={tableHeaderStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.id}>
                  <td style={tableCellStyle}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                      >
                        {manager.name[0]?.toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontWeight: 500,
                          color: darkMode ? "#e2e8f0" : "#1e293b",
                        }}
                      >
                        {manager.name}
                      </span>
                    </div>
                  </td>
                  <td style={tableCellStyle}>{manager.email}</td>
                  <td style={tableCellStyle}>
                    <span
                      className="px-2 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: darkMode ? "#312e81" : "#eef2ff",
                        color: darkMode ? "#a5b4fc" : "#6366f1",
                      }}
                    >
                      {manager.project_count}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{manager.total_tasks}</td>
                  <td style={tableCellStyle}>
                    <span
                      className="px-2 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: darkMode ? "#14532d" : "#dcfce7",
                        color: darkMode ? "#6ee7b7" : "#16a34a",
                      }}
                    >
                      {manager.completed_tasks}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {manager.created_at
                      ? new Date(manager.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {managers.length === 0 && (
            <p
              className="text-center py-8"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              No managers found
            </p>
          )}
        </div>
      )}

      {/* Annotators Tab */}
      {activeTab === "annotators" && (
        <div style={cardStyle} className="overflow-x-auto">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
          >
            All Annotators
          </h3>
          <table className="w-full">
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Annotator</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Skills</th>
                <th style={tableHeaderStyle}>Assigned</th>
                <th style={tableHeaderStyle}>Completed</th>
                <th style={tableHeaderStyle}>QA Tasks</th>
                <th style={tableHeaderStyle}>Projects</th>
              </tr>
            </thead>
            <tbody>
              {annotators.map((annotator) => (
                <tr key={annotator.id}>
                  <td style={tableCellStyle}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981, #14b8a6)",
                        }}
                      >
                        {annotator.name[0]?.toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontWeight: 500,
                          color: darkMode ? "#e2e8f0" : "#1e293b",
                        }}
                      >
                        {annotator.name}
                      </span>
                    </div>
                  </td>
                  <td style={tableCellStyle}>{annotator.email}</td>
                  <td style={tableCellStyle}>
                    <div className="flex flex-wrap gap-1">
                      {(annotator.skills || []).slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {(annotator.skills || []).length > 3 && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          +{annotator.skills!.length - 3}
                        </span>
                      )}
                      {(!annotator.skills || annotator.skills.length === 0) && (
                        <span
                          style={{
                            color: darkMode ? "#64748b" : "#94a3b8",
                            fontSize: "0.875rem",
                          }}
                        >
                          None
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={tableCellStyle}>{annotator.assigned_tasks}</td>
                  <td style={tableCellStyle}>
                    <span
                      className="px-2 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: darkMode ? "#14532d" : "#dcfce7",
                        color: darkMode ? "#6ee7b7" : "#16a34a",
                      }}
                    >
                      {annotator.completed_tasks}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {annotator.qa_completed}/{annotator.qa_tasks}
                  </td>
                  <td style={tableCellStyle}>{annotator.invited_projects}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {annotators.length === 0 && (
            <p
              className="text-center py-8"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              No annotators found
            </p>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div style={cardStyle} className="overflow-x-auto">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
          >
            All Projects
          </h3>
          <table className="w-full">
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Project</th>
                <th style={tableHeaderStyle}>Category</th>
                <th style={tableHeaderStyle}>Manager</th>
                <th style={tableHeaderStyle}>Tasks</th>
                <th style={tableHeaderStyle}>Progress</th>
                <th style={tableHeaderStyle}>Annotators</th>
                <th style={tableHeaderStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        fontWeight: 500,
                        color: darkMode ? "#e2e8f0" : "#1e293b",
                      }}
                    >
                      {project.details}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      {project.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{project.manager_name}</td>
                  <td style={tableCellStyle}>{project.total_tasks}</td>
                  <td style={tableCellStyle}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-20 h-2 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: darkMode ? "#334155" : "#e2e8f0",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              project.total_tasks > 0
                                ? (project.completed_tasks /
                                    project.total_tasks) *
                                  100
                                : 0
                            }%`,
                            backgroundColor: "#22c55e",
                          }}
                        />
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        {project.completed_tasks}/{project.total_tasks}
                      </span>
                    </div>
                  </td>
                  <td style={tableCellStyle}>{project.invited_annotators}</td>
                  <td style={tableCellStyle}>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: project.is_completed
                          ? darkMode
                            ? "#14532d"
                            : "#dcfce7"
                          : darkMode
                          ? "#713f12"
                          : "#fef3c7",
                        color: project.is_completed
                          ? darkMode
                            ? "#6ee7b7"
                            : "#16a34a"
                          : darkMode
                          ? "#fcd34d"
                          : "#d97706",
                      }}
                    >
                      {project.is_completed ? "Completed" : "In Progress"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && (
            <p
              className="text-center py-8"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              No projects found
            </p>
          )}
        </div>
      )}

      {/* Users Tab - Manage Admin Privileges */}
      {activeTab === "users" && (
        <div>
          {/* Current Admins Section */}
          <div style={cardStyle} className="overflow-x-auto mb-6">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
            >
              🛡️ Current Admins ({admins.length})
            </h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Admin</th>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>Joined</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td style={tableCellStyle}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444, #f97316)",
                          }}
                        >
                          {admin.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <span
                            style={{
                              fontWeight: 500,
                              color: darkMode ? "#e2e8f0" : "#1e293b",
                            }}
                          >
                            {admin.name}
                          </span>
                          <span
                            className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: darkMode ? "#7f1d1d" : "#fef2f2",
                              color: darkMode ? "#fca5a5" : "#dc2626",
                            }}
                          >
                            ADMIN
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>{admin.email}</td>
                    <td style={tableCellStyle}>
                      {admin.created_at
                        ? new Date(admin.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() =>
                          handleDemoteFromAdmin(admin.id, admin.name)
                        }
                        disabled={demotingUserId === admin.id}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: darkMode ? "#7f1d1d" : "#fef2f2",
                          color: darkMode ? "#fca5a5" : "#dc2626",
                          border: `1px solid ${
                            darkMode ? "#991b1b" : "#fecaca"
                          }`,
                          cursor:
                            demotingUserId === admin.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: demotingUserId === admin.id ? 0.6 : 1,
                        }}
                      >
                        {demotingUserId === admin.id
                          ? "Demoting..."
                          : "Demote to Manager"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admins.length === 0 && (
              <p
                className="text-center py-8"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                No admins found
              </p>
            )}
          </div>

          {/* All Users Section - Promote to Admin */}
          <div style={cardStyle} className="overflow-x-auto">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: darkMode ? "#e2e8f0" : "#1e293b" }}
            >
              👥 All Users - Promote to Admin
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              Select a user to grant them admin privileges. Admins can view all
              platform statistics and manage other users.
            </p>
            <table className="w-full">
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>User</th>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>Current Role</th>
                  <th style={tableHeaderStyle}>Details</th>
                  <th style={tableHeaderStyle}>Joined</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={tableCellStyle}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{
                            background:
                              user.role === "manager"
                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                : "linear-gradient(135deg, #10b981, #14b8a6)",
                          }}
                        >
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontWeight: 500,
                            color: darkMode ? "#e2e8f0" : "#1e293b",
                          }}
                        >
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>{user.email}</td>
                    <td style={tableCellStyle}>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                        style={{
                          backgroundColor:
                            user.role === "manager"
                              ? darkMode
                                ? "#312e81"
                                : "#eef2ff"
                              : darkMode
                              ? "#14532d"
                              : "#dcfce7",
                          color:
                            user.role === "manager"
                              ? darkMode
                                ? "#a5b4fc"
                                : "#6366f1"
                              : darkMode
                              ? "#6ee7b7"
                              : "#16a34a",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {user.role === "manager" && (
                        <span className="text-sm">
                          {user.project_count || 0} projects
                        </span>
                      )}
                      {user.role === "annotator" && (
                        <div className="flex flex-wrap gap-1">
                          {(user.skills || []).slice(0, 2).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: darkMode
                                  ? "#334155"
                                  : "#f1f5f9",
                                color: darkMode ? "#94a3b8" : "#64748b",
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {(user.skills || []).length > 2 && (
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: darkMode
                                  ? "#334155"
                                  : "#f1f5f9",
                                color: darkMode ? "#94a3b8" : "#64748b",
                              }}
                            >
                              +{user.skills!.length - 2}
                            </span>
                          )}
                          {(!user.skills || user.skills.length === 0) && (
                            <span
                              style={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                fontSize: "0.875rem",
                              }}
                            >
                              No skills
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handlePromoteToAdmin(user.id, user.name)}
                        disabled={promotingUserId === user.id}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          color: "#ffffff",
                          border: "none",
                          cursor:
                            promotingUserId === user.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: promotingUserId === user.id ? 0.6 : 1,
                        }}
                      >
                        {promotingUserId === user.id
                          ? "Promoting..."
                          : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allUsers.length === 0 && (
              <p
                className="text-center py-8"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                No users found to promote
              </p>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        darkMode={darkMode}
      />
    </div>
  );
}
