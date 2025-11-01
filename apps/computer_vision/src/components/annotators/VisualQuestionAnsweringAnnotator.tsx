import { useEffect } from 'react';
import type {
  VisualQuestionAnsweringResult,
  VisualQuestionAnsweringSchema
} from '../../types/tasks';

interface VisualQuestionAnsweringAnnotatorProps {
  schema: VisualQuestionAnsweringSchema;
  value: VisualQuestionAnsweringResult;
  onChange: (value: VisualQuestionAnsweringResult) => void;
}

export const VisualQuestionAnsweringAnnotator = ({
  schema,
  value,
  onChange
}: VisualQuestionAnsweringAnnotatorProps) => {
  useEffect(() => {
    if (value.payload.answers.length !== schema.questions.length) {
      onChange({
        kind: 'visual_question_answering',
        payload: {
          aspects: value.payload.aspects,
          answers: schema.questions.map((question) => ({
            id: question.id,
            text: value.payload.answers.find((answer) => answer.id === question.id)?.text ?? ''
          }))
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.questions]);

  const toggleAspect = (aspect: string) => {
    const set = new Set(value.payload.aspects);
    set.has(aspect) ? set.delete(aspect) : set.add(aspect);
    onChange({
      kind: 'visual_question_answering',
      payload: {
        aspects: Array.from(set),
        answers: value.payload.answers
      }
    });
  };

  const updateAnswer = (id: string, text: string) => {
    onChange({
      kind: 'visual_question_answering',
      payload: {
        aspects: value.payload.aspects,
        answers: value.payload.answers.map((answer) =>
          answer.id === id ? { ...answer, text } : answer
        )
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[5fr,4fr]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg">
        <img
          src={schema.image}
          alt="Visual question answering subject"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-inner">
        <section className="space-y-3">
          <h2 className="text-lg font-medium uppercase tracking-wide text-slate-400">Aspects</h2>
          <div className="flex flex-wrap gap-3">
            {schema.aspects.map((aspect) => {
              const selected = value.payload.aspects.includes(aspect);
              return (
                <button
                  key={aspect}
                  type="button"
                  onClick={() => toggleAspect(aspect)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    selected
                      ? 'bg-ls-primary text-white shadow-lg shadow-ls-primary/40'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {aspect}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-lg font-medium uppercase tracking-wide text-slate-400">Questions</h2>
          <div className="flex flex-col gap-5">
            {schema.questions.map((question) => (
              <div
                key={question.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {question.id.toUpperCase()}
                </p>
                <p className="mt-1 text-base text-white">{question.text}</p>
                <textarea
                  value={
                    value.payload.answers.find((answer) => answer.id === question.id)?.text ?? ''
                  }
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-ls-primary/60 focus:ring-ls-primary/40"
                  placeholder="Write your answer"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
