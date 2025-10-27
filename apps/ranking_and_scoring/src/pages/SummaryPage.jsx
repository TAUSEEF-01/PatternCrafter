import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { templates } from '../data/templates'
import { useLabelingContext } from '../context/LabelingContext'

export function SummaryPage() {
  const { selections, startedAt, clearAll } = useLabelingContext()
  const [copied, setCopied] = useState(false)
  const [syncState, setSyncState] = useState('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const summary = useMemo(
    () =>
      templates.map((template) => {
        const record = selections[template.id]
        return {
          id: template.id,
          title: template.title,
          group: template.group,
          completed: Boolean(record?.payload),
          payload: record?.payload ?? null,
          createdAt: record?.createdAt ?? null,
          updatedAt: record?.updatedAt ?? null,
        }
      }),
    [selections],
  )

  const jsonOutput = useMemo(
    () =>
      JSON.stringify(
        {
          startedAt,
          generatedAt: new Date().toISOString(),
          templates: summary,
        },
        null,
        2,
      ),
    [summary, startedAt],
  )

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      setCopied(false)
      console.error('Failed to copy summary', error)
    }
  }

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `labeling-summary-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const syncWithBackend = async () => {
    const annotations = summary
      .filter((item) => item.payload)
      .map((item) => ({
        templateId: item.id,
        payload: item.payload,
        createdAt: item.createdAt ?? new Date().toISOString(),
        updatedAt: item.updatedAt ?? new Date().toISOString(),
      }))

    if (!annotations.length) {
      setSyncMessage('No completed templates to sync.')
      return
    }

    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/annotations`

    setSyncState('pending')
    setSyncMessage('')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const result = await response.json()
      setSyncState('success')
      setSyncMessage(`Synced ${annotations.length} template${annotations.length > 1 ? 's' : ''} at ${result.savedAt}.`)
    } catch (error) {
      console.error('Failed to sync annotations', error)
      setSyncState('error')
      setSyncMessage('Sync failed. Ensure the FastAPI server is running.')
    }
  }

  return (
    <div className="summary">
      <header className="summary__header">
        <div>
          <h1>Labeling Summary</h1>
          <p>Review the captured annotations in JSON format.</p>
        </div>
        <div className="summary__actions">
          <Link to="/" className="workspace__primary-link workspace__primary-link--compact">
            Back to workspace
          </Link>
          <button type="button" className="workspace__ghost-btn" onClick={clearAll}>
            Clear all selections
          </button>
        </div>
      </header>
      <section className="summary__table">
        <h2>Progress overview</h2>
        <ul>
          {summary.map((item) => (
            <li key={item.id} className="summary__row">
              <div>
                <h3>{item.title}</h3>
                <p>{item.group}</p>
              </div>
              <span className={`summary__status${item.completed ? ' is-complete' : ''}`}>
                {item.completed ? 'Completed' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="summary__output">
        <div className="summary__toolbar">
          <button type="button" className="workspace__primary-link workspace__primary-link--compact" onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button type="button" className="workspace__ghost-btn" onClick={downloadJson}>
            Download JSON
          </button>
          <button
            type="button"
            className="workspace__ghost-btn"
            disabled={syncState === 'pending'}
            onClick={syncWithBackend}
          >
            {syncState === 'pending' ? 'Syncing...' : 'Sync to backend'}
          </button>
        </div>
        {syncMessage ? (
          <div
            className={`summary__notice${
              syncState === 'error' ? ' summary__notice--error' : ' summary__notice--success'
            }`}
          >
            {syncMessage}
          </div>
        ) : null}
        <pre className="summary__code" aria-label="JSON summary">
          <code>{jsonOutput}</code>
        </pre>
      </section>
    </div>
  )
}
