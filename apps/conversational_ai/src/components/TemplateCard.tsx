import { Link } from 'react-router-dom'
import type { Template } from '../types'

interface TemplateCardProps {
  template: Template
}

const accentColors = ['#4F46E5', '#059669', '#DC2626', '#0EA5E9', '#F97316']

export function TemplateCard({ template }: TemplateCardProps) {
  const accent =
    accentColors[
      Math.abs(
        Array.from(template.id).reduce((acc, char) => acc + char.charCodeAt(0), 0),
      ) % accentColors.length
    ]

  return (
    <article className="template-card">
      <div className="template-card__stripe" style={{ background: accent }} aria-hidden />
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
