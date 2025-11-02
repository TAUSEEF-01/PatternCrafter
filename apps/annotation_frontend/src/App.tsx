import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from '@/components/NavBar';
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

export default function App() {
  return (
    <div className="min-h-full">
      <NavBar />
      <div className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <Navigate to="/projects" />
              </RequireAuth>
            }
          />
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
            path="/invites"
            element={
              <RequireAuth>
                <RequireNonAnnotator>
                  <InvitesPage />
                </RequireNonAnnotator>
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
