import { FormEvent, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link as RRLink, useNavigate } from 'react-router-dom';

const Link = RRLink as unknown as any;

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'annotator' | 'manager'>('annotator');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password, role);
      nav('/projects');
    } catch (e: any) {
      setError(e?.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <div className="card w-full max-w-md">
        <div className="card-body space-y-5">
          <div className="text-center">
            <h1 className="card-title text-2xl mb-1">Create an account</h1>
            <p className="muted">Get started with PatternCrafter</p>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="select"
                value={role}
                onChange={(e) => setRole(e.target.value as 'annotator' | 'manager')}
              >
                <option value="annotator">Annotator</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
