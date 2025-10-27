import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useState } from "react";

const defaultEndpoints = {
  // served statically by the portal after a prepare step
  conversationalAI:
    import.meta.env.VITE_CONVERSATIONAL_AI_URL || "/apps/ca/index.html",
  rankingAndScoring:
    import.meta.env.VITE_RANKING_SCORING_URL || "/apps/rs/index.html",
  // Flask backend will be started by the portal dev script
  intentSlotTester:
    import.meta.env.VITE_INTENT_SLOT_URL || "/apps/ist/index.html",
};

type AppKey = keyof typeof defaultEndpoints;

function Nav() {
  return (
    <div className="navbar">
      <div className="navwrap">
        <NavLink to="/" className="brand" aria-label="PatternCrafter Home">
          PatternCrafter
        </NavLink>
        <div className="spacer" />
        <nav className="nav">
          <NavLink
            to="/portal"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Portal
          </NavLink>
          <NavLink
            to="/conversational-ai"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Conversational AI
          </NavLink>
          <NavLink
            to="/ranking-and-scoring"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Ranking & Scoring
          </NavLink>
          <NavLink
            to="/intent-slot-tester"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Intent & Slot Tester
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-wrap">
        <div className="foot-left">
          <div className="foot-brand">PatternCrafter</div>
          <div className="foot-copy">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a
            href="https://github.com/TAUSEEF-01/PatternCrafter"
            target="_blank"
            rel="noreferrer"
          >
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
  return (
    <div className="page">
      <Nav />
      {!ready && <div style={{ padding: 16 }}>Loading {title}…</div>}
      <iframe
        className="iframe"
        title={title}
        src={src}
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
      key: "conversationalAI",
      name: "Conversational AI",
      path: "/conversational-ai",
      url: defaultEndpoints.conversationalAI,
    },
    {
      key: "rankingAndScoring",
      name: "Ranking & Scoring",
      path: "/ranking-and-scoring",
      url: defaultEndpoints.rankingAndScoring,
    },
    {
      key: "intentSlotTester",
      name: "Intent & Slot Tester",
      path: "/intent-slot-tester",
      url: defaultEndpoints.intentSlotTester,
    },
  ];

  return (
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
                  Craft, annotate, and evaluate conversational AI datasets and
                  templates—all in one place.
                </p>
                <div className="row" style={{ marginTop: 12 }}>
                  <Link
                    className="btn primary"
                    to="/portal"
                    aria-label="Enter portal"
                  >
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
                  A unified workspace to annotate conversational data, craft
                  ranking/scoring labels, and explore responses—all from a
                  single aesthetic interface.
                </p>
              </section>
              <section className="grid">
                {entries.map((e) => (
                  <div key={e.key} className="card">
                    <h2>{e.name}</h2>
                    <p>
                      Open the module embedded in the portal or launch it in a
                      separate tab.
                    </p>
                    <div className="row">
                      <Link className="btn primary" to={e.path}>
                        Open
                      </Link>
                      <a
                        className="btn"
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        New tab
                      </a>
                    </div>
                    <div className="meta">{e.url}</div>
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
          <IframePage
            src={defaultEndpoints.conversationalAI}
            title="Conversational AI"
          />
        }
      />
      <Route
        path="/ranking-and-scoring"
        element={
          <IframePage
            src={defaultEndpoints.rankingAndScoring}
            title="Ranking & Scoring"
          />
        }
      />
      <Route
        path="/intent-slot-tester"
        element={
          <IframePage
            src={defaultEndpoints.intentSlotTester}
            title="Intent & Slot Tester"
          />
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
                  The page you’re looking for doesn’t exist. You can enter the
                  portal or open a module below.
                </p>
                <div className="row" style={{ padding: "0 20px" }}>
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
                      <a
                        className="btn"
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                      >
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
  );
}
