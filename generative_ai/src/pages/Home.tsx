import { useEffect, useMemo, useState } from 'react';
import { mockFetchTemplates } from '../mockApi';
import type { TemplateMeta } from '../types';
import TemplateCard from '../components/TemplateCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './Home.css';

const groupOrder = ['Generative AI', 'Vision', 'Conversational'];

const sortTemplates = (templates: TemplateMeta[]) =>
  [...templates].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });

function Home() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    mockFetchTemplates()
      .then((data) => {
        if (mounted) {
          setTemplates(sortTemplates(data));
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err?.message ?? 'Unable to load templates.');
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const unique = Array.from(new Set(templates.map((t) => t.group)));
    const sorted = unique.sort((a, b) => {
      const idxA = groupOrder.indexOf(a);
      const idxB = groupOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return ['all', ...sorted];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (selectedGroup === 'all') return templates;
    return templates.filter((template) => template.group === selectedGroup);
  }, [templates, selectedGroup]);

  if (loading) {
    return (
      <LoadingState hint="Fetching curated Generative AI workflows for you." />
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="home-view">
      <section className="hero">
        <div className="hero-content">
          <h1>
            Discover beautifully crafted labeling workspaces for Generative AI
            evaluation.
          </h1>
          <p>
            Choose a template to assess conversations, compare model responses,
            grade summaries, or curate pairwise rankings optimized for clarity
            and responsiveness across devices.
          </p>
        </div>
      </section>

      <section className="filter-bar" aria-label="Template categories">
        {groups.map((group) => {
          const label = group === 'all' ? 'All templates' : group;
          const active = selectedGroup === group;
          return (
            <button
              key={group}
              type="button"
              className={active ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setSelectedGroup(group)}
            >
              {label}
            </button>
          );
        })}
      </section>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          title="No templates in this category yet"
          message="Choose another track or reset the filters to continue exploring curated workspaces."
        />
      ) : (
        <section className="template-grid" aria-live="polite">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </section>
      )}
    </div>
  );
}

export default Home;
