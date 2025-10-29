import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockFetchTemplate, mockSubmitAnnotation } from '../mockApi';
import type { Template } from '../types';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './LabelPage.css';

type AnnotationState = Record<string, unknown>;

type TemplateRenderer = (args: {
  template: Template;
  annotation: AnnotationState;
  update: (key: string, value: unknown) => void;
  setAnnotation: Dispatch<SetStateAction<AnnotationState>>;
}) => ReactNode;

const yesNoOptions = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const chatbotChecks = [
  {
    key: 'failsToFollow',
    label: 'Fails to follow the correct instruction / task',
  },
  {
    key: 'inappropriateForCustomer',
    label: 'Inappropriate for customer assistant',
  },
  { key: 'hallucination', label: 'Hallucination' },
  {
    key: 'satisfiesConstraint',
    label: 'Satisfies constraint provided in the instruction',
  },
  { key: 'containsSexual', label: 'Contains sexual content' },
  { key: 'containsViolent', label: 'Contains violent content' },
  {
    key: 'encouragesViolence',
    label: 'Encourages or fails to discourage violence/abuse/terrorism/self-harm',
  },
  {
    key: 'denigratesProtectedClass',
    label: 'Denigrates a protected class',
  },
  { key: 'givesHarmfulAdvice', label: 'Gives harmful advice' },
  { key: 'expressesOpinion', label: 'Expresses opinion' },
  { key: 'expressesMoralJudgment', label: 'Expresses moral judgment' },
];

function getInitialAnnotation(template: Template): AnnotationState {
  switch (template.id) {
    case 'chatbot-assessment':
      return chatbotChecks.reduce<AnnotationState>(
        (acc, item) => ({ ...acc, [item.key]: '' }),
        { likertScale: 4, reviewNotes: '' },
      );
    case 'human-feedback-collection':
      return { preferredAnswer: '', justification: '' };
    case 'llm-ranker':
      return {
        relevantResults: [],
        biasedResults: [],
        unassigned: Array.isArray(template.example.items)
          ? template.example.items.map((item: any) => item.id)
          : [],
        notes: '',
      };
    case 'response-grading':
      return { rating: 3, strengths: '', weaknesses: '' };
    case 'supervised-llm':
      return { response: '' };
    case 'visual-ranker':
      return {
        rankedImages: Array.isArray(template.example.images)
          ? template.example.images.map((image: any) => image.id)
          : [],
        topPick: '',
        notes: '',
      };
    default:
      return {};
  }
}

const renderers: Record<string, TemplateRenderer> = {
  'chatbot-assessment': ({ template, annotation, update }) => {
    const messages = Array.isArray(template.example?.messages)
      ? (template.example.messages as Array<{ role: string; content: string }>)
      : [];

    return (
      <div className="workspace-section">
        <div className="chat-transcript" role="log" aria-label="Conversation">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === 'assistant'
                  ? 'chat-bubble assistant'
                  : 'chat-bubble user'
              }
            >
              <span className="chat-role">{message.role}</span>
              <p>{message.content}</p>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Evaluate the assistant</h3>
          <div className="likert-control">
            <label htmlFor="likert-scale">
              Overall quality (Likert scale 1–7)
            </label>
            <div className="likert-slider">
              <input
                id="likert-scale"
                type="range"
                min={1}
                max={7}
                value={annotation.likertScale as number}
                onChange={(event) =>
                  update('likertScale', Number(event.target.value))
                }
              />
              <span>{annotation.likertScale as number}</span>
            </div>
          </div>
          <div className="binary-group">
            {chatbotChecks.map((item) => (
              <fieldset key={item.key}>
                <legend>{item.label}</legend>
                <div className="binary-options">
                  {yesNoOptions.map((option) => (
                    <label
                      key={option.value}
                      className={
                        annotation[item.key] === option.value ? 'selected' : ''
                      }
                    >
                      <input
                        type="radio"
                        name={item.key}
                        value={option.value}
                        checked={annotation[item.key] === option.value}
                        onChange={() => update(item.key, option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="text-field">
            Reviewer notes (optional)
            <textarea
              rows={4}
              value={(annotation.reviewNotes as string) ?? ''}
              onChange={(event) => update('reviewNotes', event.target.value)}
              placeholder="Capture quick observations, guidance, or rationale."
            />
          </label>
        </div>
      </div>
    );
  },
  'human-feedback-collection': ({ template, annotation, update }) => {
    const prompt = template.example?.prompt as string;
    const answer1 = template.example?.answer1 as string;
    const answer2 = template.example?.answer2 as string;

    return (
      <div className="workspace-section">
        <div className="panel">
          <h3>Prompt</h3>
          <p className="prompt-text">{prompt}</p>
        </div>
        <div className="pairwise-grid">
          {[{ id: 'answer1', text: answer1 }, { id: 'answer2', text: answer2 }].map(
            (option) => {
              const selected = annotation.preferredAnswer === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? 'pairwise-option selected' : 'pairwise-option'}
                  onClick={() => update('preferredAnswer', option.id)}
                >
                  <header>
                    <span>{option.id === 'answer1' ? 'Model A' : 'Model B'}</span>
                    {selected && <strong>Preferred</strong>}
                  </header>
                  <p>{option.text}</p>
                </button>
              );
            },
          )}
        </div>
        <div className="pairwise-controls">
          <button
            type="button"
            className={
              annotation.preferredAnswer === 'tie'
                ? 'pairwise-chip active'
                : 'pairwise-chip'
            }
            onClick={() => update('preferredAnswer', 'tie')}
          >
            Tie / equally strong
          </button>
          <label className="text-field">
            Rationale (optional)
            <textarea
              rows={4}
              value={(annotation.justification as string) ?? ''}
              onChange={(event) => update('justification', event.target.value)}
              placeholder="Share what influenced your selection or highlight trade-offs."
            />
          </label>
        </div>
      </div>
    );
  },
  'llm-ranker': ({ template, annotation, update, setAnnotation }) => {
    const items = Array.isArray(template.example?.items)
      ? (template.example.items as Array<{
          id: string;
          title: string;
          body: string;
        }>)
      : [];

    const relevant = (annotation.relevantResults as string[]) ?? [];
    const biased = (annotation.biasedResults as string[]) ?? [];
    const unassigned = (annotation.unassigned as string[]) ?? [];

    const moveItem = (id: string, target: 'relevant' | 'biased' | 'unassigned') => {
      setAnnotation((prev) => {
        const nextRelevant = new Set(relevant);
        const nextBiased = new Set(biased);
        const nextUnassigned = new Set(unassigned);

        nextRelevant.delete(id);
        nextBiased.delete(id);
        nextUnassigned.delete(id);

        if (target === 'relevant') {
          nextRelevant.add(id);
        } else if (target === 'biased') {
          nextBiased.add(id);
        } else {
          nextUnassigned.add(id);
        }

        return {
          ...prev,
          relevantResults: Array.from(nextRelevant),
          biasedResults: Array.from(nextBiased),
          unassigned: Array.from(nextUnassigned),
        };
      });
    };

    const renderItemCard = (id: string) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) return null;
      const classification: Array<{ label: string; target: 'relevant' | 'biased' | 'unassigned' }> = [
        { label: 'Relevant', target: 'relevant' },
        { label: 'Biased', target: 'biased' },
        { label: 'Unassigned', target: 'unassigned' },
      ];
      return (
        <article key={item.id} className="ranker-item">
          <header>
            <span>{item.title}</span>
          </header>
          <p>{item.body}</p>
          <div className="ranker-actions">
            {classification.map((option) => (
              <button
                key={option.target}
                type="button"
                className="ranker-chip"
                onClick={() => moveItem(item.id, option.target)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </article>
      );
    };

    return (
      <div className="workspace-section">
        <div className="panel">
          <h3>{template.example?.task as string}</h3>
          <p className="prompt-text">{template.example?.prompt as string}</p>
        </div>
        <div className="ranker-columns">
          <section>
            <header>
              <h4>Relevant results</h4>
              <span>{relevant.length}</span>
            </header>
            <div className="ranker-stack">
              {relevant.map(renderItemCard)}
              {relevant.length === 0 && (
                <p className="ranker-empty">No responses tagged yet.</p>
              )}
            </div>
          </section>
          <section>
            <header>
              <h4>Biased results</h4>
              <span>{biased.length}</span>
            </header>
            <div className="ranker-stack">
              {biased.map(renderItemCard)}
              {biased.length === 0 && (
                <p className="ranker-empty">Awaiting review for bias signals.</p>
              )}
            </div>
          </section>
          <section>
            <header>
              <h4>Unassigned pool</h4>
              <span>{unassigned.length}</span>
            </header>
            <div className="ranker-stack">
              {unassigned.map(renderItemCard)}
              {unassigned.length === 0 && (
                <p className="ranker-empty">All responses are classified.</p>
              )}
            </div>
          </section>
        </div>
        <label className="text-field">
          Notes (optional)
          <textarea
            rows={4}
            value={(annotation.notes as string) ?? ''}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Summarize trends, highlight edge cases, or add follow-up actions."
          />
        </label>
      </div>
    );
  },
  'response-grading': ({ template, annotation, update }) => {
    const document = Array.isArray(template.example?.document)
      ? (template.example.document as string[])
      : [];
    const summary = template.example?.summary as string;

    return (
      <div className="workspace-section response-layout">
        <section className="document-pane">
          <header>
            <h3>Long document</h3>
          </header>
          <div className="document-scroll">
            {document.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
        <section className="summary-pane">
          <header>
            <h3>Summary to grade</h3>
          </header>
          <p>{summary}</p>
          <div className="rating-row">
            <label htmlFor="summary-rating">Quality rating</label>
            <input
              id="summary-rating"
              type="range"
              min={1}
              max={5}
              value={annotation.rating as number}
              onChange={(event) => update('rating', Number(event.target.value))}
            />
            <span className="rating-badge">{annotation.rating as number}/5</span>
          </div>
          <label className="text-field">
            Strengths observed
            <textarea
              rows={3}
              value={(annotation.strengths as string) ?? ''}
              onChange={(event) => update('strengths', event.target.value)}
              placeholder="Where did the summary excel?"
            />
          </label>
          <label className="text-field">
            Improvement areas
            <textarea
              rows={3}
              value={(annotation.weaknesses as string) ?? ''}
              onChange={(event) => update('weaknesses', event.target.value)}
              placeholder="Document hallucinations, omissions, or tonal issues."
            />
          </label>
        </section>
      </div>
    );
  },
  'supervised-llm': ({ template, annotation, update }) => (
    <div className="workspace-section">
      <div className="panel">
        <h3>Prompt</h3>
        <p className="prompt-text">{template.example?.prompt as string}</p>
      </div>
      <label className="text-field">
        Author the assistant response
        <textarea
          rows={10}
          value={(annotation.response as string) ?? ''}
          onChange={(event) => update('response', event.target.value)}
          placeholder="Compose a high-quality completion following internal style and safety guidelines."
        />
      </label>
    </div>
  ),
  'visual-ranker': ({ template, annotation, setAnnotation, update }) => {
    const images = Array.isArray(template.example?.images)
      ? (template.example.images as Array<{ id: string; html?: string }>)
      : [];
    const ranked = (annotation.rankedImages as string[]) ?? [];
    const topPick = (annotation.topPick as string) ?? '';

    const reorder = (id: string, direction: -1 | 1) => {
      setAnnotation((prev) => {
        const current = [...ranked];
        const index = current.indexOf(id);
        if (index === -1) return prev;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= current.length) return prev;
        const updated = [...current];
        const [removed] = updated.splice(index, 1);
        updated.splice(newIndex, 0, removed);
        return { ...prev, rankedImages: updated };
      });
    };

    const resetOrder = () => {
      setAnnotation((prev) => ({
        ...prev,
        rankedImages: images.map((image) => image.id),
      }));
    };

    return (
      <div className="workspace-section">
        <div className="panel">
          <h3>Prompt</h3>
          <p className="prompt-text">{template.example?.prompt as string}</p>
        </div>
        <div className="visual-grid">
          {ranked.map((imageId, index) => {
            const entry = images.find((item) => item.id === imageId);
            if (!entry) return null;
            return (
              <article key={entry.id} className="visual-card">
                <header>
                  <span className="badge">#{index + 1}</span>
                  <div className="visual-controls">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => reorder(entry.id, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => reorder(entry.id, 1)}
                      disabled={index === ranked.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </header>
                <div className="visual-preview">
                  {entry.html ? (
                    <div
                      className="visual-placeholder"
                      dangerouslySetInnerHTML={{ __html: entry.html }}
                    />
                  ) : (
                    <div className="visual-placeholder">
                      <span>{entry.id}</span>
                    </div>
                  )}
                </div>
                <footer>
                  <label className="top-choice">
                    <input
                      type="radio"
                      name="topPick"
                      value={entry.id}
                      checked={topPick === entry.id}
                      onChange={() => update('topPick', entry.id)}
                    />
                    Mark as standout choice
                  </label>
                </footer>
              </article>
            );
          })}
        </div>
        <div className="visual-actions">
          <button type="button" className="secondary-btn" onClick={resetOrder}>
            Reset to original order
          </button>
          <label className="text-field">
            Creative direction notes (optional)
            <textarea
              rows={4}
              value={(annotation.notes as string) ?? ''}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Describe the winning concept, lighting cues, or revision requests."
            />
          </label>
        </div>
      </div>
    );
  },
};

function validate(templateId: string, annotation: AnnotationState): string[] {
  switch (templateId) {
    case 'chatbot-assessment': {
      const missing = chatbotChecks
        .filter((item) => !annotation[item.key])
        .map((item) => item.label);
      return missing;
    }
    case 'human-feedback-collection':
      return annotation.preferredAnswer ? [] : ['Select the preferred answer'];
    case 'llm-ranker': {
      const relevant = (annotation.relevantResults as string[]) ?? [];
      const biased = (annotation.biasedResults as string[]) ?? [];
      return relevant.length || biased.length
        ? []
        : ['Classify at least one response'];
    }
    case 'response-grading': {
      const rating = Number(annotation.rating ?? 0);
      return rating > 0 ? [] : ['Provide a rating'];
    }
    case 'supervised-llm':
      return (annotation.response as string)?.trim()
        ? []
        : ['Draft the model response'];
    case 'visual-ranker': {
      const ranked = (annotation.rankedImages as string[]) ?? [];
      const topPick = annotation.topPick as string;
      const missing: string[] = [];
      if (!ranked.length) missing.push('Rank the visuals');
      if (!topPick) missing.push('Highlight the standout visual');
      return missing;
    }
    default:
      return [];
  }
}

function LabelPage() {
  const { templateId = '' } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [annotation, setAnnotation] = useState<AnnotationState>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    mockFetchTemplate(templateId)
      .then((data) => {
        setTemplate(data);
        setAnnotation(getInitialAnnotation(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'Unable to load template.');
        setLoading(false);
      });
  }, [templateId]);

  const update = (key: string, value: unknown) => {
    setAnnotation((prev) => ({ ...prev, [key]: value }));
  };

  const renderer = template ? renderers[template.id] : null;
  const validationErrors = useMemo(
    () => (template ? validate(template.id, annotation) : []),
    [template, annotation],
  );
  const isValid = validationErrors.length === 0;

  const handleSubmit = async () => {
    if (!template || !isValid) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await mockSubmitAnnotation(template.id, annotation, {
        client: 'react-workspace',
      });
      navigate('/results', { state: { highlightSubmission: result.id } });
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.detail ??
          err?.message ??
          'Unable to submit annotation.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState label="Loading template experience..." hint="Rendering tailored controls for this workflow." />
    );
  }

  if (error || !template) {
    return <ErrorState message={error ?? 'Template unavailable.'} />;
  }

  return (
    <div className="label-view">
      <header className="workspace-header">
        <div>
          <h1>{template.title}</h1>
          <p>{template.group}</p>
        </div>
        <div className="workspace-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate('/')}
          >
            Back to gallery
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit annotation'}
          </button>
        </div>
      </header>

      <div className="workspace-content">
        <section className="workspace-main">
          {renderer
            ? renderer({ template, annotation, update, setAnnotation })
            : null}
        </section>
        <aside className="workspace-sidebar">
          <section className="sidebar-section">
            <h3>Template details</h3>
            {template.detailsHtml ? (
              <div
                className="sidebar-html"
                dangerouslySetInnerHTML={{ __html: template.detailsHtml }}
              />
            ) : (
              <p>
                This workspace doesn&apos;t include additional details yet.
                Start labeling to explore the controls.
              </p>
            )}
          </section>
          <section className="sidebar-section">
            <h3>Example payload</h3>
            <pre className="sidebar-code">
              {JSON.stringify(template.example, null, 2)}
            </pre>
          </section>
          {validationErrors.length > 0 && (
            <section className="sidebar-section warnings">
              <h3>Before you submit</h3>
              <ul>
                {validationErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {submitError && (
            <section className="sidebar-section errors">
              <h3>Submission error</h3>
              <p>{submitError}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default LabelPage;
