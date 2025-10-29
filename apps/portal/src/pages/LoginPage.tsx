import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();
  const location = useLocation() as any;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) return setError('Email is required');
    try {
      await login(email, password);
      const to = location?.state?.from?.pathname || '/profile';
      nav(to, { replace: true });
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    }
  }

  return (
    <div className="shell">
      <main className="main">
        <section className="auth-wrap" aria-label="Login">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo" aria-hidden>
                PC
              </div>
              <div className="auth-title">Sign in</div>
              <p className="auth-subtitle">Access your PatternCrafter workspace.</p>
            </div>
            <div className="auth-body">
              <form
                onSubmit={onSubmit}
                className="form"
                aria-describedby={error ? 'login-error' : undefined}
              >
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
                {error && (
                  <div id="login-error" className="form-error">
                    {error}
                  </div>
                )}
                <div className="auth-actions">
                  <button className="btn primary" type="submit">
                    Sign in
                  </button>
                  <Link className="btn" to="/register">
                    Create account
                  </Link>
                </div>
                <div className="meta">
                  <Link className="link-muted" to="/register">
                    New here? Create an account
                  </Link>
                </div>
              </form>
              <div className="auth-divider">or continue with</div>
              <div className="socials">
                <button className="social-btn" type="button" aria-label="Continue with GitHub">
                  GitHub
                </button>
                <button className="social-btn" type="button" aria-label="Continue with Google">
                  Google
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
