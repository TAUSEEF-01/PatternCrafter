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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-xl bg-[#EBD6FB] border border-purple-100">
        <div className="card-body space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 text-[#2E073F]">Create an account</h1>
            <p className="text-gray-600">Get started with PatternCrafter</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2E073F] mb-2">
                Name
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#7A1CAC] focus:outline-none transition-colors text-[#2E073F] placeholder:text-gray-400"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2E073F] mb-2">
                Email
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#7A1CAC] focus:outline-none transition-colors text-[#2E073F] placeholder:text-gray-400"
                type="email"
                placeholder="abc@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2E073F] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-gray-200 focus:border-[#7A1CAC] focus:outline-none transition-colors text-[#2E073F] placeholder:text-gray-400"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#7A1CAC] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2E073F] mb-2">
                Role
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#7A1CAC] focus:outline-none transition-colors text-[#2E073F] bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value as 'annotator' | 'manager')}
              >
                <option value="annotator">Annotator</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#7A1CAC] to-[#9D4EDD] hover:from-[#6A1A9C] hover:to-[#8D3ECD] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 pt-2">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#7A1CAC] hover:text-[#9D4EDD] transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}