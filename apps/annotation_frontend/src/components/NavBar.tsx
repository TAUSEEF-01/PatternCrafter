import { Link as RRLink, NavLink as RRNavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const Link = RRLink as unknown as any;
  const NavLink = RRNavLink as unknown as any;
  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="container-app py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="inline-block h-6 w-6 rounded bg-primary-600" />
          <span>PatternCrafter</span>
        </Link>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
                to="/projects"
              >
                Projects
              </NavLink>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
                to="/invites"
              >
                Invites
              </NavLink>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
                to="/profile"
              >
                Profile
              </NavLink>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="hidden md:inline">{user.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                  {user.role}
                </span>
              </div>
              <button className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
                to="/login"
              >
                Login
              </NavLink>
              <NavLink
                className={({ isActive }: any) =>
                  `text-sm ${
                    isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
                to="/register"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
