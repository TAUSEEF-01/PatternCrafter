import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth, RequireAuth } from './auth';
import { ThemeProvider, useTheme } from './theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

const defaultEndpoints = {
  // served statically by the portal after a prepare step
  conversationalAI: import.meta.env.VITE_CONVERSATIONAL_AI_URL || '/apps/ca/index.html',
  rankingAndScoring: import.meta.env.VITE_RANKING_SCORING_URL || '/apps/rs/index.html',
  computerVision: import.meta.env.VITE_COMPUTER_VISION_URL || '/apps/cv/index.html',
  // Flask backend will be started by the portal dev script
  intentSlotTester: import.meta.env.VITE_INTENT_SLOT_URL || '/apps/ist/index.html',
};

type AppKey = keyof typeof defaultEndpoints;

function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  return (
    <div className="navbar">
      <div className="navwrap">
        <NavLink to="/" className="brand" aria-label="PatternCrafter Home">
          PatternCrafter
        </NavLink>
        <div className="spacer" />
        <nav className="nav">
          <NavLink to="/portal" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Portal
          </NavLink>
          <NavLink
            to="/conversational-ai"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Conversational AI
          </NavLink>
          <NavLink
            to="/ranking-and-scoring"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Ranking & Scoring
          </NavLink>
          <NavLink
            to="/computer-vision"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Computer Vision
          </NavLink>
          <NavLink
            to="/intent-slot-tester"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Intent & Slot Tester
          </NavLink>
        </nav>
        <div className="nav-actions">
          <button className="btn" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
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
                      nav('/portal');
                    }}
                  >
                    Portal
                  </button>
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
  // Show footer only when user has scrolled to the bottom of the page
  const [atBottom, setAtBottom] = useState(false);
  const [interacted, setInteracted] = useState(false);

  function checkBottom() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const viewport = window.innerHeight || doc.clientHeight;
    const scrollHeight = doc.scrollHeight;
    const threshold = 8; // px tolerance
    const FOOTER_H = 72; // estimated footer height to avoid flicker
    if (!interacted) {
      setAtBottom(false);
      return;
    }
    const isBottom = scrollTop + viewport + FOOTER_H >= scrollHeight - threshold;
    setAtBottom(!!isBottom);
  }

  // Attach listeners (scroll/resize/input) and perform checks
  // Note: We avoid debounce for responsiveness and simplicity
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
    // Initial check (again) in case of dynamic content
    // Do not show before user interacts
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
      {!ready && <div style={{ padding: 16 }}>Loading {title}...</div>}
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
      key: 'computerVision',
      name: 'Computer Vision',
      path: '/computer-vision',
      url: defaultEndpoints.computerVision,
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
        <Routes>
          {/* Landing page */}
          <Route
            path="/"
            element={
              <div className="shell">
                <Nav />
                <main className="main">
                  <section className="hero">
                    <div className="kicker">Welcome to</div>
                    <div className="title">PatternCrafter</div>
                    <p className="subtitle">
                      Craft, annotate, and evaluate conversational AI datasets and templates -- all
                      in one place.
                    </p>
                    <div className="row" style={{ marginTop: 12 }}>
                      <Link className="btn primary" to="/portal" aria-label="Enter portal">
                        Enter Portal
                      </Link>
                      <a
                        className="btn"
                        href="https://github.com/TAUSEEF-01/PatternCrafter"
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub
                      </a>
                    </div>
                  </section>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/portal"
            element={
              <div className="shell">
                <Nav />
                <main className="main">
                  <section className="hero">
                    <div className="kicker">Build, Label, and Evaluate</div>
                    <div className="title">PatternCrafter Portal</div>
                    <p className="subtitle">
                      A unified workspace to annotate conversational data, craft ranking/scoring
                      labels, and explore responses -- all from a single aesthetic interface.
                    </p>
                  </section>
                  <section className="grid">
                    {entries.map((e) => (
                      <div key={e.key} className="card">
                        <h2>{e.name}</h2>
                        <p>
                          Open the module embedded in the portal or launch it in a separate tab.
                        </p>
                        <div className="row">
                          <Link className="btn primary" to={e.path}>
                            Open
                          </Link>
                          {/* <a
                        className="btn"
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        New tab
                      </a> */}
                        </div>
                        {/* <div className="meta">{e.url}</div> */}
                      </div>
                    ))}
                  </section>
                </main>
                <Footer />
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
            path="/computer-vision"
            element={<IframePage src={defaultEndpoints.computerVision} title="Computer Vision" />}
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
                <main className="main">
                  <section className="hero">
                    <div className="title">Page not found</div>
                    <p className="subtitle">
                      The page you're looking for doesn't exist. You can enter the portal or open a
                      module below.
                    </p>
                    <div className="row" style={{ padding: '0 20px' }}>
                      <Link className="btn primary" to="/portal">
                        Enter Portal
                      </Link>
                      <Link className="btn" to="/">
                        Landing
                      </Link>
                    </div>
                  </section>
                  <section className="grid">
                    {entries.map((e) => (
                      <div key={e.key} className="card">
                        <h2>{e.name}</h2>
                        <div className="row">
                          <Link className="btn primary" to={e.path}>
                            Open
                          </Link>
                          <a className="btn" href={e.url} target="_blank" rel="noreferrer">
                            New tab
                          </a>
                        </div>
                      </div>
                    ))}
                  </section>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
