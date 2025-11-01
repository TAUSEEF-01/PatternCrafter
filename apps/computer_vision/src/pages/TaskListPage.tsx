import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { tasks } from '../data/tasks';
import { TaskCard } from '../components/TaskCard';
import { useTaskStore } from '../store/taskStore';

export const TaskListPage = () => {
  const records = useTaskStore((state) => state.records);
  const sortedTasks = useMemo(
    () => tasks.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    []
  );

  return (
    <div className="space-y-12">
      <header className="mx-auto max-w-4xl text-center">
        {/* <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.4em] text-slate-300">
          Label Studio Lite
        </p> */}
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
          Curated computer vision labeling tasks for rapid prototyping
        </h1>
        {/* <p className="mt-4 text-lg text-slate-300">
          Explore ready-to-annotate tasks inspired by Label Studio templates. All interactions run
          on the frontend, perfect for concept validation and UI testing.
        </p> */}
        <Link
          to="/summary"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Review collected JSON
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M5.25 4.5A.75.75 0 0 0 4.5 5.25v13.5a.75.75 0 0 0 1.5 0V5.25a.75.75 0 0 0-.75-.75Z" />
            <path d="M9 5.25a.75.75 0 0 0 0 1.5h9.69l-2.47 2.47a.75.75 0 0 0 1.06 1.06l3.75-3.75a.75.75 0 0 0 0-1.06l-3.75-3.75a.75.75 0 1 0-1.06 1.06l2.47 2.47H9Z" />
          </svg>
        </Link>
      </header>

      <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} isComplete={Boolean(records[task.id])} />
        ))}
      </section>
    </div>
  );
};
