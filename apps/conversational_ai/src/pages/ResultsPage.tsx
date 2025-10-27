import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchAnnotations } from '../api/client'
import type { Annotation } from '../types'
import { downloadJson } from '../utils/download'

export function ResultsPage() {
  const location = useLocation()
  const [items, setItems] = useState<Annotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const { items: annotations } = await fetchAnnotations()
        if (!cancelled) {
          setItems(annotations.slice().reverse())
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load annotations.')
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

  const formattedJson = JSON.stringify(items, null, 2)
  const hasItems = items.length > 0
  const handleDownload = () => {
    if (!hasItems) return
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadJson(items, `annotations-${timestamp}.json`)
  }

  return (
    <div className="results">
      <header className="results__header">
        <div>
          <h1>Annotation Results</h1>
          {location.state?.fromWorkspace ? (
            <p className="results__toast">Annotation saved successfully.</p>
          ) : null}
        </div>
        <div className="results__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleDownload}
            disabled={!hasItems}
          >
            Download annotations
          </button>
          <Link to="/" className="btn btn--ghost">
            ← Back to templates
          </Link>
        </div>
      </header>
      {isLoading ? <p>Loading annotations…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!isLoading && !error ? (
        <pre className="results__code">
          <code>{formattedJson}</code>
        </pre>
      ) : null}
      {!isLoading && !error && items.length === 0 ? <p>No annotations yet. Try labeling a task.</p> : null}
    </div>
  )
}
