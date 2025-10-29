import { Link } from 'react-router-dom';
import type { TemplateMeta } from '../types';
import './TemplateCard.css';

interface Props {
  template: TemplateMeta;
}

const fallbackImages: Record<string, string> = {
  'chatbot-assessment':
    'radial-gradient(circle at 20% 20%, #4338ca, #2563eb 55%, #38bdf8 100%)',
  'human-feedback-collection':
    'radial-gradient(circle at 20% 20%, #047857, #22c55e 55%, #facc15 100%)',
  'llm-ranker':
    'radial-gradient(circle at 20% 20%, #7c3aed, #6366f1 55%, #a855f7 100%)',
  'response-grading':
    'radial-gradient(circle at 20% 20%, #be123c, #f97316 55%, #fde047 100%)',
  'supervised-llm':
    'radial-gradient(circle at 20% 20%, #0f766e, #0ea5e9 55%, #22d3ee 100%)',
  'visual-ranker':
    'radial-gradient(circle at 20% 20%, #1e3a8a, #4c1d95 55%, #f472b6 100%)',
};

const TemplateCard = ({ template }: Props) => {
  const href = `/label/${template.id}`;
  const background =
    template.image && template.image.startsWith('http')
      ? `url(${template.image})`
      : fallbackImages[template.id] ?? 'linear-gradient(135deg, #4f46e5, #06b6d4)';

  return (
    <article className="template-card">
      <div className="template-visual" style={{ background }}>
        <span className="template-group">{template.group}</span>
      </div>
      <div className="template-body">
        <h3>{template.title}</h3>
        {template.detailsHtml ? (
          <div
            className="template-details"
            dangerouslySetInnerHTML={{ __html: template.detailsHtml }}
          />
        ) : (
          <p className="template-placeholder">
            Explore an interactive workspace tailored for this Generative AI
            labeling workflow.
          </p>
        )}
      </div>
      <div className="template-footer">
        <Link to={href} className="template-cta">
          Launch workspace
        </Link>
      </div>
    </article>
  );
};

export default TemplateCard;
