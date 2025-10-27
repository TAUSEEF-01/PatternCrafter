import { useEffect, useState } from 'react'
import { fetchTemplates } from '../api/client'
import type { Template } from '../types'
import { TemplateCard } from '../components/TemplateCard'

export function HomePage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const items = await fetchTemplates()
        if (!cancelled) {
          setTemplates(items)
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load templates.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <h1>Conversational AI Labeling Studio</h1>
        <p>
          Explore curated labeling workspaces inspired by Label Studio. Choose a template, annotate
          sample dialogue data, and review the captured metadata in real time.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#templates">
            Browse templates
          </a>
          <a className="btn btn--ghost" href="/results">
            View results
          </a>
        </div>
      </section>
      <section className="template-grid" id="templates">
        {isLoading ? <p>Loading templates…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!isLoading && !error && templates.length === 0 ? (
          <p>No templates available yet.</p>
        ) : null}
        <div className="template-grid__items">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  )
}

