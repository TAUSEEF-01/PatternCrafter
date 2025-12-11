import {
  Link as RRLink,
  NavLink as RRNavLink,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import NotificationBell from "./NotificationBell";

// Theme Context
interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev: boolean) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Animated Background Component
export function AnimatedBackground() {
  const { darkMode } = useTheme();

  useEffect(() => {
    const canvas = document.getElementById(
      "app-bg-canvas"
    ) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = darkMode
          ? `rgba(200, 200, 255, ${particle.opacity})`
          : `rgba(100, 100, 200, ${particle.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = darkMode
          ? "rgba(150, 150, 255, 0.5)"
          : "rgba(100, 100, 200, 0.3)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.strokeStyle = darkMode
        ? "rgba(200, 200, 255, 0.15)"
        : "rgba(100, 100, 200, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.globalAlpha = ((120 - distance) / 120) * 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [darkMode]);

  return (
    <canvas
      id="app-bg-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// NavBar Component
interface NavBarProps {
  isAuthPage?: boolean;
}

export default function NavBar({ isAuthPage = false }: NavBarProps) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const Link = RRLink as unknown as any;
  const NavLink = RRNavLink as unknown as any;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("profile-dropdown");
      const button = document.getElementById("profile-button");
      if (
        dropdown &&
        button &&
        !dropdown.contains(e.target as Node) &&
        !button.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  return (
    <nav
      className={`${
        isAuthPage ? "fixed" : "sticky"
      } top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-lg`}
      style={{
        backgroundColor: isAuthPage
          ? darkMode
            ? "rgba(30, 27, 75, 0.8)"
            : "rgba(238, 242, 255, 0.8)"
          : darkMode
          ? "rgba(30, 27, 75, 0.95)"
          : "rgba(238, 242, 255, 0.95)",
        borderColor: darkMode
          ? "rgba(99, 102, 241, 0.3)"
          : "rgba(99, 102, 241, 0.2)",
      }}
    >
      <div className="container-app py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 font-bold text-xl hover:opacity-80 transition-opacity"
          style={{ textDecoration: "none" }}
        >
          <img
            src="/favicon.png"
            alt="PatternCrafter Logo"
            className="h-10 w-10"
            style={{ objectFit: "contain" }}
          />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            PatternCrafter
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : darkMode
                      ? "text-indigo-200 hover:text-white hover:bg-indigo-800/50"
                      : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                  }`
                }
                to="/projects"
              >
                Projects
              </NavLink>
              {user.role === "admin" && (
                <NavLink
                  className={({ isActive }: any) =>
                    `text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : darkMode
                        ? "text-indigo-200 hover:text-white hover:bg-indigo-800/50"
                        : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                    }`
                  }
                  to="/admin"
                >
                  Admin Dashboard
                </NavLink>
              )}
              {user.role === "annotator" && (
                <NavLink
                  className={({ isActive }: any) =>
                    `text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : darkMode
                        ? "text-indigo-200 hover:text-white hover:bg-indigo-800/50"
                        : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                    }`
                  }
                  to="/invites"
                >
                  Invites
                </NavLink>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  id="profile-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2"
                  style={{
                    color: darkMode ? "#a5b4fc" : "#6366f1",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "0.5rem",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode
                      ? "rgba(99, 102, 241, 0.15)"
                      : "rgba(99, 102, 241, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    id="profile-dropdown"
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "0.5rem",
                      backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                      minWidth: "220px",
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem",
                        borderBottom: `1px solid ${
                          darkMode ? "#334155" : "#e2e8f0"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          color: darkMode ? "#e2e8f0" : "#1e293b",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: darkMode ? "#94a3b8" : "#64748b",
                          display: "inline-block",
                          backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          textTransform: "capitalize",
                        }}
                      >
                        {user.role}
                      </div>
                    </div>

                    <button
                      onClick={handleProfileClick}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: darkMode ? "#e2e8f0" : "#1e293b",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        transition: "background-color 0.2s ease",
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
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        transition: "background-color 0.2s ease",
                        borderTop: `1px solid ${
                          darkMode ? "#334155" : "#e2e8f0"
                        }`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode
                          ? "#334155"
                          : "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? "bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50"
                    : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                }`}
                aria-label="Toggle theme"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : darkMode
                      ? "text-indigo-200 hover:text-white hover:bg-indigo-800/50"
                      : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                  }`
                }
                to="/login"
              >
                Login
              </NavLink>
              <NavLink
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                to="/register"
              >
                Register
              </NavLink>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? "bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50"
                    : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                }`}
                aria-label="Toggle theme"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
