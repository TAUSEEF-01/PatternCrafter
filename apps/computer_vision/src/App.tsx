import { Navigate, Route, Routes } from "react-router-dom";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TaskListPage } from "./pages/TaskListPage";
import { SummaryPage } from "./pages/SummaryPage";

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-10 md:px-10 lg:px-12">
        <main className="flex-1">
          <Routes>
            <Route index element={<TaskListPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="mt-16 text-center text-xs uppercase tracking-[0.4em] text-slate-600">
          Crafted for UI prototyping -- all data stays on-device
        </footer>
      </div>
    </div>
  );
};

export default App;
