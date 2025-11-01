import { Link } from 'react-router-dom'
import type { Template } from '../types'

interface TemplateCardProps {
  template: Template
}

const accentColor = '#EBD3F8'

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <article className="template-card">
      <div className="template-card__stripe" style={{ background: accentColor }} aria-hidden />
      <div className="template-card__content">
        <span className="template-card__type">{template.group ?? template.type}</span>
        <h2>{template.title}</h2>
        {template.details ? (
          <div
            className="template-card__details"
            dangerouslySetInnerHTML={{ __html: template.details }}
          />
        ) : null}
        <div className="template-card__actions">
          <Link to={`/workspace/${template.id}`} className="btn btn--primary">
            Open workspace
          </Link>
        </div>
      </div>
    </article>
  )
}