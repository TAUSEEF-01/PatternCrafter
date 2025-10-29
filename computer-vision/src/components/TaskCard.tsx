import { Link } from 'react-router-dom';
import type { BaseTaskDefinition } from '../types/tasks';
import { cx } from '../utils/cx';

interface TaskCardProps {
  task: BaseTaskDefinition;
  isComplete?: boolean;
}

export const TaskCard = ({ task, isComplete }: TaskCardProps) => {
  return (
    <article
      className={cx(
        'group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-ls-primary/70',
        isComplete && 'ring-2 ring-ls-primary/60'
      )}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={task.image}
          alt={task.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <p className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-widest text-slate-200">
          {task.group}
        </p>
      </div>
      <div className="flex h-full flex-col gap-4 px-6 py-6">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold text-white">{task.title}</h2>
          <div
            className="text-sm leading-relaxed text-slate-300 opacity-80 [&_dl]:mt-3 [&_dt]:font-semibold [&_dt]:uppercase [&_dt]:tracking-widest [&_dt]:text-xs [&_dt]:text-slate-400 [&_dd]:mt-1 [&_dd]:text-slate-200"
            dangerouslySetInnerHTML={{ __html: task.details }}
          />
        </header>
        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            {task.type}
          </div>
          <Link
            to={`/tasks/${task.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-ls-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-ls-primary/40 transition hover:bg-indigo-500"
          >
            {isComplete ? 'Review labels' : 'Start labeling'}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M4.5 12a.75.75 0 0 1 .75-.75h12.69l-3.22-3.22a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H5.25A.75.75 0 0 1 4.5 12Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};
