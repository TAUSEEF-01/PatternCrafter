import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name) return setError('Name is required');
    if (!email) return setError('Email is required');
    try {
      await register(name, email, password);
      nav('/profile', { replace: true });
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    }
  }

  return (
    <div className="shell">
      <main className="main">
        <section className="auth-wrap" aria-label="Register">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo" aria-hidden>
                PC
              </div>
              <div className="auth-title">Create your account</div>
              <p className="auth-subtitle">Join PatternCrafter in seconds.</p>
            </div>
            <div className="auth-body">
              <form
                onSubmit={onSubmit}
                className="form"
                aria-describedby={error ? 'register-error' : undefined}
              >
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
                {error && (
                  <div id="register-error" className="form-error">
                    {error}
                  </div>
                )}
                <div className="auth-actions">
                  <button className="btn primary" type="submit">
                    Create account
                  </button>
                  <Link className="btn" to="/login">
                    Sign in
                  </Link>
                </div>
                <div className="meta">
                  <Link className="link-muted" to="/login">
                    Already have an account? Sign in
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
