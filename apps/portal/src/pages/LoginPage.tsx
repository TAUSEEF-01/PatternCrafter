import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();
  const location = useLocation() as any;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) return setError("Email is required");
    try {
      await login(email, password);
      const to = location?.state?.from?.pathname || "/profile";
      nav(to, { replace: true });
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error(err);
    }
  }

  return (
    <div className="shell">
      <main className="main">
        <section className="hero">
          <div className="kicker">Welcome back</div>
          <div className="title">Sign in</div>
          <p className="subtitle">Access your PatternCrafter workspace.</p>
        </section>
        <section className="grid" style={{ maxWidth: 560 }}>
          <div className="card" style={{ width: "100%" }}>
            <form onSubmit={onSubmit} className="form">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              {error && <div className="form-error">{error}</div>}
              <div className="row">
                <button className="btn primary" type="submit">
                  Sign in
                </button>
                <Link className="btn" to="/register">
                  Create account
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
