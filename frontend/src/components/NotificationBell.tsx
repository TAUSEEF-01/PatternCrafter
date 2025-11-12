import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
} from "@/api/client";
import { Notification } from "@/types";
import { subscribe, NOTIFICATION_UNREAD_EVENT } from "@/lib/pubsub";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Subscribe to unread count via Observer (NotificationsProvider)
  useEffect(() => {
    // Initial fetch as fallback to ensure immediate value
    fetchUnreadCount();
    const unsubscribe = subscribe<number>(
      NOTIFICATION_UNREAD_EVENT,
      (count) => {
        setUnreadCount(count ?? 0);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(50);
      setNotifications(data);
      // Update unread count from fetched notifications
      const unread = data.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate based on notification type
    let path = "";

    if (notification.type === "invite") {
      // For invites, go to invites page with highlight parameter
      path = `/invites?highlight=${notification.project_id}`;
    } else if (notification.type === "task_assigned") {
      // For task assignments, go to project page with task highlight
      path = `/projects/${notification.project_id}?highlightTask=${notification.task_id}`;
    } else if (notification.type === "task_completed") {
      // For task completion (managers), go to specific project with task highlight
      path = `/projects/${notification.project_id}?highlightTask=${notification.task_id}`;
    }

    if (path) {
      setIsOpen(false);
      navigate(path);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invite":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "task_assigned":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        );
      case "task_completed":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      default:
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "invite":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "task_assigned":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "task_completed":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        style={{
          position: "relative",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          backgroundColor: "rgba(235, 211, 248, 0.2)",
          color: "#EBD3F8",
          border: "none",
          cursor: "pointer",
          fontSize: "1.25rem",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(235, 211, 248, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(235, 211, 248, 0.2)";
        }}
        aria-label="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              backgroundColor: "#ef4444",
              color: "white",
              borderRadius: "10px",
              padding: "2px 6px",
              fontSize: "11px",
              fontWeight: "bold",
              minWidth: "18px",
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "0.5rem",
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            minWidth: "380px",
            maxHeight: "500px",
            zIndex: 50,
            overflow: "hidden",
          }}
          className="dark:bg-slate-800 dark:border-slate-700"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              borderBottom: "1px solid #e2e8f0",
            }}
            className="dark:border-slate-700"
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: "#1e293b",
              }}
              className="dark:text-white"
            >
              Notifications
            </h3>
            <button
              onClick={fetchNotifications}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                color: "#64748b",
              }}
              className="hover:text-slate-900 dark:hover:text-white"
              aria-label="Refresh"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div
              style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}
            >
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}
            >
              No notifications
            </div>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    display: "flex",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    backgroundColor: notification.is_read
                      ? "transparent"
                      : "#f0f8ff",
                  }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-700"
                  onMouseEnter={(e) => {
                    if (notification.is_read) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (notification.is_read) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getIconBgColor(
                      notification.type
                    )}`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                      className="dark:text-white"
                    >
                      {notification.title}
                    </h4>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                      className="dark:text-slate-300"
                    >
                      {notification.message}
                    </p>
                    <span
                      style={{ fontSize: "11px", color: "#64748b" }}
                      className="dark:text-slate-400"
                    >
                      {formatTime(notification.created_at)}
                    </span>
                  </div>

                  {!notification.is_read && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#2196f3",
                        flexShrink: 0,
                        marginLeft: "8px",
                        alignSelf: "center",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
