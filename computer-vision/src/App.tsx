import { Navigate, Route, Routes } from 'react-router-dom';
import { TaskListPage } from './pages/TaskListPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { SummaryPage } from './pages/SummaryPage';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-10 md:px-10 lg:px-12">
        <nav className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ls-primary text-lg font-bold text-white shadow-lg shadow-ls-primary/40">
              LS
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Label Studio Lite</p>
              <h1 className="text-lg font-semibold text-white">Interactive annotation workspace</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3" />
        </nav>

        <main className="flex-1">
          <Routes>
            <Route index element={<TaskListPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="mt-16 text-center text-xs uppercase tracking-[0.4em] text-slate-600">
          Crafted for UI prototyping · All data stays on-device
        </footer>
      </div>
    </div>
  );
};

export default App;
