import { Navigate, Route as RRRoute, Routes as RRRoutes } from 'react-router-dom';
import NavBar, { ThemeProvider, AnimatedBackground, useTheme } from '@/components/NavBar';
import { useAuth } from '@/auth/AuthContext';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import InvitesPage from '@/pages/InvitesPage';
import TaskAnnotatePage from '@/pages/TaskAnnotatePage';
import TaskQAPage from '@/pages/TaskQAPage';
import AssignTaskPage from '@/pages/AssignTaskPage';
import ProfilePage from '@/pages/ProfilePage';
import ProjectInvitesPage from '@/pages/ProjectInvitesPage';
import CompletedTasksPage from '@/pages/CompletedTasksPage';
import WelcomePage from '@/pages/WelcomePage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireNonAnnotator({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'annotator') return <Navigate to="/projects" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { darkMode } = useTheme();
  const Routes = RRRoutes as unknown as any;
  const Route = RRRoute as unknown as any;

  return (
    <div 
      className="min-h-full"
      style={{
        backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <AnimatedBackground />
      <NavBar />
      <div className="container-app py-6" style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<WelcomePage />} />
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <RequireAuth>
                <ProjectDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:projectId/invites"
            element={
              <RequireAuth>
                <RequireNonAnnotator>
                  <ProjectInvitesPage />
                </RequireNonAnnotator>
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:projectId/completed"
            element={
              <RequireAuth>
                <RequireNonAnnotator>
                  <CompletedTasksPage />
                </RequireNonAnnotator>
              </RequireAuth>
            }
          />
          <Route
            path="/invites"
            element={
              <RequireAuth>
                <InvitesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks/:taskId/annotate"
            element={
              <RequireAuth>
                <TaskAnnotatePage />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks/:taskId/qa"
            element={
              <RequireAuth>
                <TaskQAPage />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks/:taskId/assign"
            element={
              <RequireAuth>
                <AssignTaskPage />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}