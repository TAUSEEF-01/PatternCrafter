import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">
          Annotation
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link className="hover:underline" to="/projects">
                Projects
              </Link>
              {user.role !== 'annotator' && (
                <Link className="hover:underline" to="/invites">
                  Invites
                </Link>
              )}
              <Link className="hover:underline" to="/profile">
                Profile
              </Link>
              <span className="text-sm text-gray-500">
                {user.name} ({user.role})
              </span>
              <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="hover:underline" to="/login">
                Login
              </Link>
              <Link className="hover:underline" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
