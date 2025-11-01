import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { WorkspacePage } from './pages/WorkspacePage'
import { ResultsPage } from './pages/ResultsPage'

function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspace/:templateId" element={<WorkspacePage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

