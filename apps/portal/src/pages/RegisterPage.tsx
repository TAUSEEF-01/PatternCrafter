import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name) return setError("Name is required");
    if (!email) return setError("Email is required");
    try {
      await register(name, email, password);
      nav("/profile", { replace: true });
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error(err);
    }
  }

  return (
    <div className="shell">
      <main className="main">
        <section className="hero">
          <div className="kicker">Get started</div>
          <div className="title">Create your account</div>
          <p className="subtitle">Join PatternCrafter in seconds.</p>
        </section>
        <section className="grid" style={{ maxWidth: 560 }}>
          <div className="card" style={{ width: "100%" }}>
            <form onSubmit={onSubmit} className="form">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                />
              </label>
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
                  Create account
                </button>
                <Link className="btn" to="/login">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
