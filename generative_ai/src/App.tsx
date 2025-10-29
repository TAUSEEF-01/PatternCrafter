import { NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import Home from './pages/Home';
import LabelPage from './pages/LabelPage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

const navLinks = [
  { to: '/', label: 'Templates' },
  { to: '/results', label: 'Results' },
];

function AppShell() {
  const location = useLocation();

  const pageLabel = useMemo(() => {
    if (location.pathname.startsWith('/label')) {
      return 'Workspace';
    }
    if (location.pathname.startsWith('/results')) {
      return 'Annotation Results';
    }
    return 'Template Gallery';
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark">GA</span>
            <span className="brand-name">GenAI</span>
          </NavLink>
          <nav className="main-nav" aria-label="Primary">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <p className="header-subtitle">{pageLabel}</p>
      </header>
      <main className="app-main">
        <div className="page-shell">
          <Outlet />
        </div>
      </main>
      <footer className="app-footer">
        <span>Crafted for rich Generative AI labeling experiences.</span>
        <span className="divider" aria-hidden="true">|</span>
        <span>Optimized for desktop and tablet workflows.</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="label/:templateId" element={<LabelPage />} />
        <Route path="results" element={<ResultsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
