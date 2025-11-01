import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImageCaptioningAnnotator } from '../components/annotators/ImageCaptioningAnnotator';
import { ImageClassificationAnnotator } from '../components/annotators/ImageClassificationAnnotator';
import { ObjectDetectionAnnotator } from '../components/annotators/ObjectDetectionAnnotator';
import { OcrAnnotator } from '../components/annotators/OcrAnnotator';
import { SemanticSegmentationAnnotator } from '../components/annotators/SemanticSegmentationAnnotator';
import { VisualQuestionAnsweringAnnotator } from '../components/annotators/VisualQuestionAnsweringAnnotator';
import { tasks } from '../data/tasks';
import { useTaskStore } from '../store/taskStore';
import type { AnnotationResult } from '../types/tasks';
import { createDefaultResult } from '../utils/results';

export const TaskDetailPage = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const saveResult = useTaskStore((state) => state.saveResult);
  const removeResult = useTaskStore((state) => state.removeResult);
  const setCurrentTask = useTaskStore((state) => state.setCurrentTask);
  const record = useTaskStore((state) => (taskId ? state.records[taskId] : undefined));

  const task = useMemo(() => tasks.find((item) => item.id === taskId), [taskId]);

  const [draft, setDraft] = useState<AnnotationResult | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setCurrentTask(taskId);
    return () => setCurrentTask(undefined);
  }, [setCurrentTask, taskId]);

  useEffect(() => {
    if (!task) {
      setDraft(null);
      return;
    }
    const initial = record?.result ?? createDefaultResult(task);
    setDraft(initial);
    setIsDirty(false);
  }, [record, task]);

  if (!task || !draft) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-white">Task not found</h2>
        <p className="mt-4 text-slate-300">
          The requested annotation task could not be located. Please return to the catalog and pick
          a task to continue labeling.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ls-primary px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-ls-primary/40 transition hover:bg-indigo-500"
        >
          Back to catalog
        </Link>
      </div>
    );
  }

  const handleChange = (value: AnnotationResult) => {
    setDraft(value);
    setIsDirty(true);
  };

  const handleReset = () => {
    setDraft(createDefaultResult(task));
    setIsDirty(true);
  };

  const handleSave = () => {
    saveResult(task.id, task.title, draft);
    setIsDirty(false);
  };

  const handleComplete = () => {
    saveResult(task.id, task.title, draft);
    navigate('/summary');
  };

  const handleClearSaved = () => {
    removeResult(task.id);
    setDraft(createDefaultResult(task));
    setIsDirty(false);
  };

  const renderAnnotator = () => {
    switch (task.schema.kind) {
      case 'image_captioning':
        if (draft.kind !== 'image_captioning') return null;
        return (
          <ImageCaptioningAnnotator schema={task.schema} value={draft} onChange={handleChange} />
        );
      case 'image_classification':
        if (draft.kind !== 'image_classification') return null;
        return (
          <ImageClassificationAnnotator schema={task.schema} value={draft} onChange={handleChange} />
        );
      case 'visual_question_answering':
        if (draft.kind !== 'visual_question_answering') return null;
        return (
          <VisualQuestionAnsweringAnnotator
            schema={task.schema}
            value={draft}
            onChange={handleChange}
          />
        );
      case 'object_detection':
        if (draft.kind !== 'object_detection') return null;
        return (
          <ObjectDetectionAnnotator schema={task.schema} value={draft} onChange={handleChange} />
        );
      case 'semantic_segmentation':
        if (draft.kind !== 'semantic_segmentation') return null;
        return (
          <SemanticSegmentationAnnotator
            schema={task.schema}
            value={draft}
            onChange={handleChange}
          />
        );
      case 'ocr':
        if (draft.kind !== 'ocr') return null;
        return <OcrAnnotator schema={task.schema} value={draft} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-lg md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-300 transition hover:text-white"
          >
            <span className="-ml-1 text-sm">←</span> Back to catalog
          </Link>
          <h1 className="text-3xl font-bold text-white">{task.title}</h1>
          <div
            className="text-sm leading-relaxed text-slate-300 opacity-90 [&_dl]:mt-3 [&_dt]:font-semibold [&_dt]:uppercase [&_dt]:tracking-widest [&_dt]:text-xs [&_dt]:text-slate-400 [&_dd]:mt-1 [&_dd]:text-slate-200"
            dangerouslySetInnerHTML={{ __html: task.details }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Reset draft
          </button>
          {record && (
            <button
              type="button"
              onClick={handleClearSaved}
              className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-200 transition hover:border-red-400 hover:text-red-100"
            >
              Clear saved
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-ls-primary/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ls-primary transition hover:border-ls-primary hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
            disabled={!isDirty}
          >
            Save progress
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="rounded-full bg-ls-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-ls-primary/40 transition hover:bg-indigo-500"
          >
            Save &amp; review JSON
          </button>
        </div>
      </header>
      {renderAnnotator()}
    </div>
  );
};
