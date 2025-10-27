import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { templates } from '../data/templates'
import { useLabelingContext } from '../context/LabelingContext'
import { TaskRenderer } from '../components/TaskRenderer'

export function LabelingWorkspace() {
  const fallbackTemplates = templates
  const [catalogue, setCatalogue] = useState(fallbackTemplates)
  const [activeId, setActiveId] = useState(() => fallbackTemplates[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { selections, resetSelection } = useLabelingContext()

  useEffect(() => {
    const controller = new AbortController()
    const fetchTemplates = async () => {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/templates`

      setLoading(true)
      setError('')

      try {
        const response = await fetch(endpoint, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data = await response.json()
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setCatalogue(data.templates)
          setActiveId((previous) =>
            data.templates.some((item) => item.id === previous)
              ? previous
              : data.templates[0].id,
          )
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }
        console.warn('Falling back to bundled templates. Reason:', err)
        setError('Using bundled templates (could not reach API).')
        setCatalogue(fallbackTemplates)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchTemplates()

    return () => controller.abort()
  }, [fallbackTemplates])

  const activeTemplate = useMemo(
    () => catalogue.find((item) => item.id === activeId) ?? null,
    [activeId, catalogue],
  )

  const hasSelection = Boolean(activeId && selections[activeId]?.payload)

  return (
    <div className="workspace">
      <aside className="workspace__sidebar" aria-label="Template list">
        <div className="workspace__sidebar-header">
          <h1>Ranking &amp; Scoring Studio</h1>
          <p>Select a labeling template to start reviewing examples.</p>
          {loading ? <span className="workspace__meta">Loading catalogue...</span> : null}
          {error ? <span className="workspace__meta workspace__meta--warning">{error}</span> : null}
        </div>
        <ul className="workspace__sidebar-list">
          {catalogue.map((template) => {
            const isActive = template.id === activeId
            const isCompleted = Boolean(selections[template.id])

            return (
              <li key={template.id}>
                <button
                  type="button"
                  className={`workspace__sidebar-item${isActive ? ' is-active' : ''}${
                    isCompleted ? ' is-complete' : ''
                  }`}
                  onClick={() => setActiveId(template.id)}
                >
                  <span className="workspace__sidebar-title">{template.title}</span>
                  <span className="workspace__sidebar-caption">{template.group}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="workspace__sidebar-footer">
          <Link to="/summary" className="workspace__primary-link">
            Review JSON summary
          </Link>
        </div>
      </aside>
      <main className="workspace__content">
        {activeTemplate ? (
          <>
            <header className="workspace__content-header">
              <div>
                <span className="workspace__badge">{activeTemplate.type}</span>
                <h2>{activeTemplate.title}</h2>
                <p className="workspace__subtitle">{activeTemplate.group}</p>
              </div>
              <div className="workspace__content-actions">
                <button
                  type="button"
                  className="workspace__ghost-btn"
                  onClick={() => resetSelection(activeTemplate.id)}
                >
                  Reset selection
                </button>
                <Link to="/summary" className="workspace__primary-link workspace__primary-link--compact">
                  Summary
                </Link>
              </div>
            </header>
            <section className="workspace__details">
              <div
                className="workspace__details-card"
                dangerouslySetInnerHTML={{ __html: activeTemplate.details }}
              />
            </section>
            <section className="workspace__labeling">
              <TaskRenderer template={activeTemplate} />
            </section>
            <section className="workspace__status">
              <h3>Status</h3>
              <p>
                {hasSelection
                  ? 'Selection captured. You can review and edit it anytime.'
                  : 'No selection yet. Interact with the content above to log your decision.'}
              </p>
            </section>
          </>
        ) : (
          <div className="workspace__empty">
            <p>Select a template on the left to start labeling.</p>
          </div>
        )}
      </main>
    </div>
  )
}
