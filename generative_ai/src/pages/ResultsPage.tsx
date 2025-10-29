import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mockFetchSubmissions, mockFetchTemplates } from '../mockApi';
import type { Submission, TemplateMeta } from '../types';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './ResultsPage.css';

interface LocationState {
  highlightSubmission?: string;
}

const downloadJsonFile = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function ResultsPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const highlightId = state?.highlightSubmission;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([mockFetchSubmissions(), mockFetchTemplates()])
      .then(([submissionData, templateData]) => {
        if (!mounted) return;
        setSubmissions(
          submissionData.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        setTemplates(templateData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'Unable to load submissions');
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (selectedTemplate === 'all') return submissions;
    return submissions.filter(
      (entry) => entry.templateId === selectedTemplate,
    );
  }, [submissions, selectedTemplate]);

  const handleDownloadAll = useCallback(() => {
    if (!filteredSubmissions.length) return;
    const scope =
      selectedTemplate === 'all' ? 'all-templates' : selectedTemplate;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJsonFile(
      filteredSubmissions.map(
        ({ id, templateId, annotation, createdAt, user }) => ({
          id,
          templateId,
          annotation,
          createdAt,
          user,
        }),
      ),
      `annotations-${scope}-${timestamp}.json`,
    );
  }, [filteredSubmissions, selectedTemplate]);

  const handleDownloadSingle = useCallback((submission: Submission) => {
    const timestamp = new Date(submission.createdAt)
      .toISOString()
      .replace(/[:.]/g, '-');
    downloadJsonFile(
      {
        templateId: submission.templateId,
        annotation: submission.annotation,
        createdAt: submission.createdAt,
        user: submission.user,
      },
      `${submission.templateId}-${timestamp}.json`,
    );
  }, []);

  if (loading) {
    return (
      <LoadingState
        label="Gathering labeled results..."
        hint="Collating structured annotations across templates."
      />
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="results-view">
      <header className="results-header">
        <div>
          <h1>Annotation results</h1>
          <p>
            Export-ready JSON submissions captured across GenAI-inspired
            workspaces.
          </p>
        </div>
        <div className="results-metrics">
          <div>
            <strong>{submissions.length}</strong>
            <span>Total submissions</span>
          </div>
          <div>
            <strong>{templates.length}</strong>
            <span>Available templates</span>
          </div>
        </div>
      </header>

      <section className="results-controls">
        <div className="results-filter">
          <label>
            Filter by template
            <select
              value={selectedTemplate}
              onChange={(event) => setSelectedTemplate(event.target.value)}
            >
              <option value="all">All templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="download-btn"
          onClick={handleDownloadAll}
          disabled={!filteredSubmissions.length}
        >
          Download JSON
        </button>
      </section>

      {filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          message="Complete a labeling run to see structured annotation payloads here."
        />
      ) : (
        <section className="results-list">
          {filteredSubmissions.map((submission) => {
            const templateMeta = templates.find(
              (template) => template.id === submission.templateId,
            );
            const isHighlighted = submission.id === highlightId;
            return (
              <article
                key={submission.id}
                className={
                  isHighlighted ? 'submission-card highlighted' : 'submission-card'
                }
              >
                <header>
                  <div>
                    <h3>{templateMeta?.title ?? submission.templateId}</h3>
                    <span>
                      {new Date(submission.createdAt).toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="submission-actions">
                    <button
                      type="button"
                      className="download-chip"
                      onClick={() => handleDownloadSingle(submission)}
                    >
                      Download
                    </button>
                    <code>{submission.id.slice(0, 8)}</code>
                  </div>
                </header>
                <pre>
                  {JSON.stringify(
                    {
                      templateId: submission.templateId,
                      annotation: submission.annotation,
                      createdAt: submission.createdAt,
                      user: submission.user,
                    },
                    null,
                    2,
                  )}
                </pre>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default ResultsPage;
