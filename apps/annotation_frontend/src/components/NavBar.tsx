import { Link as RRLink, NavLink as RRNavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme Context
interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Animated Background Component
export function AnimatedBackground() {
  const { darkMode } = useTheme();

  useEffect(() => {
    const canvas = document.getElementById('app-bg-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

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
        ctx.shadowColor = darkMode ? 'rgba(150, 150, 255, 0.5)' : 'rgba(100, 100, 200, 0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.strokeStyle = darkMode ? 'rgba(200, 200, 255, 0.15)' : 'rgba(100, 100, 200, 0.1)';
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
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [darkMode]);

  return (
    <canvas
      id="app-bg-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// NavBar Component
export default function NavBar() {
  const { user, logout, unseenInvites, markInvitesSeen } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  
  const Link = RRLink as unknown as any;
  const NavLink = RRNavLink as unknown as any;

  return (
    <nav 
      style={{
        backgroundColor: '#7A1CAC',
        color: '#EBD3F8',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: '1px solid rgba(235, 211, 248, 0.2)',
      }}
    >
      <div className="container-app py-3 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 font-semibold text-lg"
          style={{ color: '#EBD3F8', textDecoration: 'none' }}
        >
          <span 
            className="inline-block h-6 w-6 rounded" 
            style={{ backgroundColor: '#EBD3F8' }}
          />
          <span>PatternCrafter</span>
        </Link>
        
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'font-semibold' : 'hover:text-white'
                  }`
                }
                style={({ isActive }: any) => ({
                  color: isActive ? '#ffffff' : '#EBD3F8',
                  textDecoration: 'none',
                })}
                to="/projects"
              >
                Projects
              </NavLink>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'font-semibold' : 'hover:text-white'
                  }`
                }
                style={({ isActive }: any) => ({
                  color: isActive ? '#ffffff' : '#EBD3F8',
                  textDecoration: 'none',
                })}
                to="/invites"
                onClick={() => {
                  // when user clicks invites, mark them as seen
                  try {
                    markInvitesSeen();
                  } catch {}
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Invites
                  {unseenInvites && (
                    <span aria-hidden="true" title="New invite" style={{ display: 'inline-block' }}>
                      {/* Bell wrapper so we can position the red dot */}
                      <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
                        <svg
                          className="invite-bell"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="white"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ color: '#EBD3F8' }}
                        >
                          <path d="M15 17H9M12 3C10.8954 3 10 3.89543 10 5V6.15385C7.834 7.01084 6.33333 9.0625 6.33333 11.5V15L5 16.5V17H19V16.5L17.6667 15V11.5C17.6667 9.0625 16.166 7.01084 14 6.15385V5C14 3.89543 13.1046 3 12 3Z" fill="#EBD3F8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>

                        {/* small pulsing red dot */}
                        <span className="invite-dot" aria-hidden="true" />
                      </span>
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'font-semibold' : 'hover:text-white'
                  }`
                }
                style={({ isActive }: any) => ({
                  color: isActive ? '#ffffff' : '#EBD3F8',
                  textDecoration: 'none',
                })}
                to="/profile"
              >
                Profile
              </NavLink>
              
              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('profile-dropdown');
                    if (dropdown) {
                      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    }
                  }}
                  className="hidden sm:flex items-center gap-2 text-sm"
                  style={{ 
                    color: '#EBD3F8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.5rem',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(235, 211, 248, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div 
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: '#EBD3F8', color: '#2E073F' }}
                  >
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    style={{ color: '#EBD3F8' }}
                  >
                    <path 
                      d="M4 6L8 10L12 6" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div
                  id="profile-dropdown"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    padding: '0.75rem',
                    minWidth: '200px',
                    zIndex: 50,
                  }}
                >
                  <div style={{ 
                    padding: '0.5rem',
                    borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ 
                      fontWeight: '600',
                      color: darkMode ? '#e2e8f0' : '#1e293b',
                      marginBottom: '0.25rem',
                    }}>
                      {user.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: darkMode ? '#94a3b8' : '#64748b',
                      display: 'inline-block',
                      backgroundColor: darkMode ? '#334155' : '#f1f5f9',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                    }}>
                      {user.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(235, 211, 248, 0.2)',
                  color: '#EBD3F8',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(235, 211, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(235, 211, 248, 0.2)';
                }}
                aria-label="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button 
                className="btn btn-outline"
                onClick={logout}
                style={{
                  backgroundColor: 'transparent',
                  color: '#EBD3F8',
                  border: '1px solid #EBD3F8',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EBD3F8';
                  e.currentTarget.style.color = '#2E073F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#EBD3F8';
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'font-semibold' : 'hover:text-white'
                  }`
                }
                style={({ isActive }: any) => ({
                  color: isActive ? '#ffffff' : '#EBD3F8',
                  textDecoration: 'none',
                })}
                to="/login"
              >
                Login
              </NavLink>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'font-semibold' : 'hover:text-white'
                  }`
                }
                style={({ isActive }: any) => ({
                  color: isActive ? '#ffffff' : '#EBD3F8',
                  textDecoration: 'none',
                })}
                to="/register"
              >
                Register
              </NavLink>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(235, 211, 248, 0.2)',
                  color: '#EBD3F8',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(235, 211, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(235, 211, 248, 0.2)';
                }}
                aria-label="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}