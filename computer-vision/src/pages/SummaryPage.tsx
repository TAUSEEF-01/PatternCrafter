import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';

export const SummaryPage = () => {
  const records = useTaskStore((state) => state.records);
  const reset = useTaskStore((state) => state.reset);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const orderedRecords = useMemo(
    () =>
      Object.values(records).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [records]
  );

  const aggregated = useMemo(
    () =>
      orderedRecords.map((record) => ({
        taskId: record.taskId,
        title: record.title,
        schema: record.schemaKind,
        updatedAt: record.updatedAt,
        data: record.result.payload
      })),
    [orderedRecords]
  );

  const jsonOutput = useMemo(() => JSON.stringify(aggregated, null, 2), [aggregated]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Clipboard copy failed', error);
    }
  };

  const handleDownload = () => {
    if (aggregated.length === 0) return;
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `label-studio-lite-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg md:flex-row md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Annotation summary</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Collected JSON payload</h1>
          <p className="mt-2 text-sm text-slate-300">
            Preview every annotation you have saved during this session. Copy the JSON payload to
            integrate with your workflow or reset to start a fresh labeling round.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Back to catalog
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-emerald-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-300 transition hover:border-emerald-300 hover:text-emerald-100"
            disabled={aggregated.length === 0}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full border border-indigo-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-200 transition hover:border-indigo-300 hover:text-indigo-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
            disabled={aggregated.length === 0}
          >
            {downloaded ? 'Downloaded' : 'Download JSON'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-200 transition hover:border-red-400 hover:text-red-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
            disabled={aggregated.length === 0}
          >
            Reset all
          </button>
        </div>
      </header>

      {aggregated.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-300">
          <h2 className="text-2xl font-semibold text-white">No annotations yet</h2>
          <p className="mx-auto mt-4 max-w-xl">
            Label any task from the catalog and your results will appear here as a structured JSON
            document.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            {orderedRecords.map((record) => (
              <article
                key={record.taskId}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-inner"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {record.schemaKind}
                    </p>
                    <h2 className="text-lg font-semibold text-white">{record.title}</h2>
                  </div>
                  <Link
                    to={`/tasks/${record.taskId}`}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-200 transition hover:border-white/40 hover:text-white"
                  >
                    Reopen
                  </Link>
                </div>
                <p className="text-xs text-slate-400">
                  Updated {new Date(record.updatedAt).toLocaleString()}
                </p>
                <pre className="max-h-60 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-relaxed text-emerald-200">
                  {JSON.stringify(record.result.payload, null, 2)}
                </pre>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Aggregated payload ({aggregated.length} tasks)
              </h2>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Clipboard ready
              </span>
            </div>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/60 p-5 text-sm leading-relaxed text-emerald-200">
              {jsonOutput}
            </pre>
          </section>
        </>
      )}
    </div>
  );
};
