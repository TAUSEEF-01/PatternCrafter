import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth, RequireAuth } from './auth';
import { ThemeProvider, useTheme } from './theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

const defaultEndpoints = {
  conversationalAI: import.meta.env.VITE_CONVERSATIONAL_AI_URL || '/apps/ca/index.html',
  rankingAndScoring: import.meta.env.VITE_RANKING_SCORING_URL || '/apps/rs/index.html',
  intentSlotTester: import.meta.env.VITE_INTENT_SLOT_URL || '/apps/ist/index.html',
};

type AppKey = keyof typeof defaultEndpoints;

// Animated Background Component
function AnimatedBackground() {
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const isDark = theme === 'dark';

    // Small particles
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
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(200, 200, 255, ${particle.opacity})`
          : `rgba(100, 100, 200, ${particle.opacity})`;
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = isDark ? 'rgba(150, 150, 255, 0.5)' : 'rgba(100, 100, 200, 0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw connections
      ctx.strokeStyle = isDark ? 'rgba(200, 200, 255, 0.15)' : 'rgba(100, 100, 200, 0.1)';
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
            ctx.globalAlpha = (120 - distance) / 120 * 0.3;
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
  }, [theme]);

  return (
    <canvas
      id="bg-canvas"
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

function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  return (
    <div className="navbar" 
    style={{
      backgroundColor: '#7A1CAC', // your new color
      color: '#EBD3F8', // text color
    }}>
      <div className="navwrap">
        <NavLink to="/" className="brand" aria-label="PatternCrafter Home">
          PatternCrafter
        </NavLink>
        <div className="spacer" />
        <div className="nav-actions"
        
        >
          <button className="btn" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <div className="profile">
              <button
                className="avatar-btn"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <span className="avatar-circle" aria-hidden>
                  {user.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join('') || 'U'}
                </span>
                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{user.name}</span>
                <i className="caret" />
              </button>
              {open && (
                <div className="dropdown" role="menu">
                  <NavLink to="/profile" onClick={() => setOpen(false)}>
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                      nav('/', { replace: true });
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const [atBottom, setAtBottom] = useState(false);
  const [interacted, setInteracted] = useState(false);

  function checkBottom() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const viewport = window.innerHeight || doc.clientHeight;
    const scrollHeight = doc.scrollHeight;
    const threshold = 8;
    const FOOTER_H = 72;
    if (!interacted) {
      setAtBottom(false);
      return;
    }
    const isBottom = scrollTop + viewport + FOOTER_H >= scrollHeight - threshold;
    setAtBottom(!!isBottom);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      if (!interacted) setInteracted(true);
      checkBottom();
    };
    const onResize = () => checkBottom();
    const onWheel = () => {
      if (!interacted) setInteracted(true);
      checkBottom();
    };
    const onTouch = () => {
      if (!interacted) setInteracted(true);
      checkBottom();
    };
    const onKey = (e: KeyboardEvent) => {
      const keys = ['End', 'PageDown', 'ArrowDown', 'ArrowUp', 'Space', 'Home', 'PageUp'];
      if (keys.includes(e.key)) {
        if (!interacted) setInteracted(true);
        checkBottom();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('keydown', onKey);
    setAtBottom(false);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!atBottom) return null;

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-wrap">
        <div className="foot-left">
          <div className="foot-brand">PatternCrafter</div>
          <div className="foot-copy">© {new Date().getFullYear()} All rights reserved.</div>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a href="https://github.com/TAUSEEF-01/PatternCrafter" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="/" aria-label="Home">
            Home
          </a>
        </nav>
      </div>
    </footer>
  );
}

function IframePage({ src, title }: { src: string; title: string }) {
  const [ready, setReady] = useState(false);
  const { theme } = useTheme();
  const themedSrc = src.includes('?') ? `${src}&theme=${theme}` : `${src}?theme=${theme}`;
  return (
    <div className="page">
      <Nav />
      {!ready && <div style={{ padding: 16 }}>Loading {title}…</div>}
      <iframe
        className="iframe"
        title={title}
        key={themedSrc}
        src={themedSrc}
        onLoad={() => setReady(true)}
      />
      <Footer />
    </div>
  );
}

export default function PortalApp() {
  const entries: Array<{
    key: AppKey;
    name: string;
    path: string;
    url: string;
  }> = [
      {
        key: 'conversationalAI',
        name: 'Conversational AI',
        path: '/conversational-ai',
        url: defaultEndpoints.conversationalAI,
      },
      {
        key: 'rankingAndScoring',
        name: 'Ranking & Scoring',
        path: '/ranking-and-scoring',
        url: defaultEndpoints.rankingAndScoring,
      },
      {
        key: 'intentSlotTester',
        name: 'Intent & Slot Tester',
        path: '/intent-slot-tester',
        url: defaultEndpoints.intentSlotTester,
      },
    ];

  return (
    <ThemeProvider>
      <AuthProvider>
        <AnimatedBackground />
        <Routes>
          <Route
            path="/"
            element={
              <div className="shell">
                <Nav />
                <main className="main" style={{
                  minHeight: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem'
                }}>
                  <div style={{ maxWidth: '1200px', width: '100%' }}>
                    <section className="hero" style={{
                      maxWidth: '900px',
                      textAlign: 'center',
                      margin: '0 auto 4rem',
                      animation: 'fadeInUp 0.8s ease-out'
                    }}>
                      <div className="kicker" style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '1rem',
                        letterSpacing: '0.05em'
                      }}>
                        Welcome to
                      </div>
                      <h1 className="title" style={{
                        fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '1.5rem',
                        lineHeight: '1.1',
                        letterSpacing: '-0.02em'
                      }}>
                        PatternCrafter
                      </h1>
                      <p className="subtitle" style={{
                        fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                        lineHeight: '1.6',
                        maxWidth: '700px',
                        margin: '0 auto 2.5rem',
                        opacity: '0.9'
                      }}>
                        Craft, annotate, and evaluate conversational AI datasets and templates—all in
                        one powerful, unified workspace.
                      </p>
                      <a
                        className="btn"
                        href="https://github.com/TAUSEEF-01/PatternCrafter"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '1.05rem',
                          padding: '0.85rem 2rem',
                          fontWeight: '600',
                          transform: 'translateY(0)',
                          transition: 'all 0.3s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ⭐ View on GitHub
                      </a>
                    </section>

                    <section style={{
                      animation: 'fadeInUp 0.8s ease-out 0.2s backwards'
                    }}>
                      <h2 style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: '3rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        Choose Your Module
                      </h2>
                      <div className="grid">
                        {entries.map((e, index) => (
                          <div
                            key={e.key}
                            className="card"
                            style={{
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              animation: `fadeInUp 0.8s ease-out ${0.3 + index * 0.1}s backwards`
                            }}
                            onMouseEnter={(el) => {
                              el.currentTarget.style.transform = 'translateY(-8px)';
                              el.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(el) => {
                              el.currentTarget.style.transform = 'translateY(0)';
                              el.currentTarget.style.boxShadow = '';
                            }}
                          >
                            <h3 style={{
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              marginBottom: '0.8rem',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {e.name}
                            </h3>
                            <p style={{
                              fontSize: '1rem',
                              lineHeight: '1.6',
                              marginBottom: '1.5rem',
                              opacity: '0.85'
                            }}>
                              {e.key === 'conversationalAI' &&
                                'Build and annotate conversational AI datasets with powerful labeling tools.'}
                              {e.key === 'rankingAndScoring' &&
                                'Create ranking and scoring labels for model evaluation and comparison.'}
                              {e.key === 'intentSlotTester' &&
                                'Test and validate intent classification and slot filling capabilities.'}
                            </p>
                            <div className="row">
                              <Link
                                className="btn primary"
                                to={e.path}
                                style={{
                                  backgroundColor: '#EBD3F8', // button color
                                  color: '#2E073F',            // text color
                                  transition: 'all 0.3s ease',
                                  flex: 1
                                }}
                              >
                                Launch Module
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </main>
                <Footer />
                <style>{`
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            }
          />
          <Route
            path="/portal"
            element={
              <div className="shell">
                <Nav />
                <main className="main" style={{ padding: '4rem 2rem' }}>
                  <section className="hero" style={{
                    textAlign: 'center',
                    marginBottom: '4rem',
                    animation: 'fadeInUp 0.8s ease-out'
                  }}>
                    <div className="kicker" style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.8rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}>
                      Build, Label, and Evaluate
                    </div>
                    <h1 className="title" style={{
                      fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '1.2rem',
                      lineHeight: '1.1',
                      letterSpacing: '-0.02em'
                    }}>
                      PatternCrafter Portal
                    </h1>
                    <p className="subtitle" style={{
                      fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
                      lineHeight: '1.6',
                      maxWidth: '750px',
                      margin: '0 auto',
                      opacity: '0.9'
                    }}>
                      A unified workspace to annotate conversational data, craft ranking/scoring
                      labels, and explore responses—all from a single aesthetic interface.
                    </p>
                  </section>
                  <section className="grid">
                    {entries.map((e) => (
                      <div
                        key={e.key}
                        className="card"
                        style={{
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(el) => {
                          el.currentTarget.style.transform = 'translateY(-8px)';
                          el.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(el) => {
                          el.currentTarget.style.transform = 'translateY(0)';
                          el.currentTarget.style.boxShadow = '';
                        }}
                      >
                        <h2 style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          marginBottom: '0.8rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {e.name}
                        </h2>
                        <p style={{
                          fontSize: '1rem',
                          lineHeight: '1.6',
                          marginBottom: '1.5rem',
                          opacity: '0.85'
                        }}>
                          Open the module embedded in the portal or launch it in a separate tab.
                        </p>
                        <div className="row">
                          <Link
                            className="btn primary"
                            to={e.path}
                            style={{
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Open Module →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </section>
                </main>
                <Footer />
                <style>{`
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            }
          />
          <Route
            path="/conversational-ai"
            element={
              <IframePage src={defaultEndpoints.conversationalAI} title="Conversational AI" />
            }
          />
          <Route
            path="/ranking-and-scoring"
            element={
              <IframePage src={defaultEndpoints.rankingAndScoring} title="Ranking & Scoring" />
            }
          />
          <Route
            path="/intent-slot-tester"
            element={
              <IframePage src={defaultEndpoints.intentSlotTester} title="Intent & Slot Tester" />
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Nav />
                <LoginPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/register"
            element={
              <>
                <Nav />
                <RegisterPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <>
                  <Nav />
                  <ProfilePage />
                  <Footer />
                </>
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <div className="shell">
                <Nav />
                <main className="main" style={{
                  minHeight: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem'
                }}>
                  <section className="hero" style={{
                    maxWidth: '800px',
                    textAlign: 'center',
                    animation: 'fadeInUp 0.8s ease-out'
                  }}>
                    <h1 className="title" style={{
                      fontSize: 'clamp(3rem, 8vw, 5rem)',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '1.5rem',
                      lineHeight: '1.1',
                      letterSpacing: '-0.02em'
                    }}>
                      404
                    </h1>
                    <h2 style={{
                      fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                      fontWeight: '700',
                      marginBottom: '1rem'
                    }}>
                      Page not found
                    </h2>
                    <p className="subtitle" style={{
                      fontSize: 'clamp(1.05rem, 2.2vw, 1.2rem)',
                      lineHeight: '1.6',
                      marginBottom: '2.5rem',
                      opacity: '0.9'
                    }}>
                      The page you're looking for doesn't exist. You can enter the portal or explore
                      our modules below.
                    </p>
                    <div className="row" style={{
                      padding: '0 20px',
                      gap: '1rem',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      marginBottom: '3rem'
                    }}>
                      <Link
                        className="btn primary"
                        to="/portal"
                        style={{
                          fontSize: '1.05rem',
                          padding: '0.85rem 2rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Enter Portal →
                      </Link>
                      <Link
                        className="btn"
                        to="/"
                        style={{
                          fontSize: '1.05rem',
                          padding: '0.85rem 2rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Go Home
                      </Link>
                    </div>
                  </section>
                  <section className="grid" style={{ marginTop: '2rem' }}>
                    {entries.map((e) => (
                      <div
                        key={e.key}
                        className="card"
                        style={{
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(el) => {
                          el.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseLeave={(el) => {
                          el.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <h2 style={{
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          marginBottom: '0.8rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {e.name}
                        </h2>
                        <div className="row" style={{ gap: '0.8rem' }}>
                          <Link
                            className="btn primary"
                            to={e.path}
                            style={{ fontSize: '0.95rem' }}
                          >
                            Open →
                          </Link>
                          <a
                            className="btn"
                            href={e.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.95rem' }}
                          >
                            New Tab ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </section>
                </main>
                <Footer />
                <style>{`
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
