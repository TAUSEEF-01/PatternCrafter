import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { fetchTasks, fetchTemplate, submitAnnotation } from '../api/client'
import type { Task, Template } from '../types'
import { CoreferenceAnnotator, type CoreferenceResultItem } from '../components/CoreferenceAnnotator'
import {
  IntentSlotAnnotator,
  type IntentSlotAnnotatorResult,
  type DialogueTurn,
} from '../components/IntentSlotAnnotator'
import { ResponseSelector } from '../components/ResponseSelector'
import { ResponseGenerator } from '../components/ResponseGenerator'

type PendingResult =
  | {
      kind: 'coreference'
      data: {
        text: string
        tokens: CoreferenceResultItem[]
      }
    }
  | {
      kind: 'intent'
      data: IntentSlotAnnotatorResult & { dialogue: DialogueTurn[] }
    }
  | {
      kind: 'response_generation'
      data: { dialogue: DialogueTurn[]; response: string }
    }
  | {
      kind: 'response_selection'
      data: {
        dialogue: DialogueTurn[]
        options: string[]
        selectedIndex: number | null
        selectedText: string | null
      }
    }

export function WorkspacePage() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId: string }>()
  const [template, setTemplate] = useState<Template | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!templateId) {
      return
    }

    let cancelled = false
    async function loadTemplateAndTasks() {
      setIsLoading(true)
      try {
        const id = templateId as string
        const [tpl, tplTasks] = await Promise.all([fetchTemplate(id), fetchTasks(id)])
        if (!cancelled) {
          setTemplate(tpl)
          setTasks(tplTasks)
          setCurrentTaskIndex(0)
          setPendingResult(null)
          setError(null)
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load workspace.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    loadTemplateAndTasks()
    return () => {
      cancelled = true
    }
  }, [templateId])

  useEffect(() => {
    setPendingResult(null)
    setError(null)
  }, [currentTaskIndex])

  const currentTask = useMemo(() => {
    if (!tasks.length) {
      return null
    }
    return tasks[Math.min(currentTaskIndex, tasks.length - 1)]
  }, [tasks, currentTaskIndex])

  if (!templateId) {
    return <Navigate to="/" replace />
  }

  const totalTasks = tasks.length

  const handleCoreferenceChange = (result: CoreferenceResultItem[]) => {
    if (!currentTask) return
    const text = (currentTask.payload.corefText as string) ?? ''
    setPendingResult({ kind: 'coreference', data: { text, tokens: result } })
  }

  const handleIntentChange = (result: IntentSlotAnnotatorResult) => {
    if (!currentTask) return
    const dialogue = ((currentTask.payload.humanMachineDialogue ?? []) as DialogueTurn[]) ?? []
    setPendingResult({
      kind: 'intent',
      data: { ...result, dialogue },
    })
  }

  const handleResponseGenerationChange = (result: { response: string }) => {
    if (!currentTask) return
    const dialogue = ((currentTask.payload.dialogue ?? []) as DialogueTurn[]) ?? []
    setPendingResult({
      kind: 'response_generation',
      data: { dialogue, response: result.response },
    })
  }

  const handleResponseSelectionChange = (result: {
    selectedIndex: number | null
    selectedText: string | null
  }) => {
    if (!currentTask) return
    const dialogue = ((currentTask.payload.humanMachineDialogue ?? []) as DialogueTurn[]) ?? []
    const options = ((currentTask.payload.responseOptions ?? []) as string[]) ?? []
    setPendingResult({
      kind: 'response_selection',
      data: { dialogue, options, selectedIndex: result.selectedIndex, selectedText: result.selectedText },
    })
  }

  const validatePendingResult = () => {
    if (!pendingResult) {
      return 'Complete the labeling step before submitting.'
    }
    switch (pendingResult.kind) {
      case 'intent':
        if (!pendingResult.data.selectedIntent) {
          return 'Please choose a dialogue intent.'
        }
        return null
      case 'response_generation':
        if (!pendingResult.data.response.trim()) {
          return 'Response cannot be empty.'
        }
        return null
      case 'response_selection':
        if (pendingResult.data.selectedIndex == null) {
          return 'Select one of the candidate responses.'
        }
        return null
      default:
        return null
    }
  }

  const saveAnnotation = async () => {
    if (!template || !currentTask || !templateId) {
      return
    }
    const validationMessage = validatePendingResult()
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const resultPayload = (pendingResult?.data ?? {}) as Record<string, unknown>
      await submitAnnotation({
        templateId,
        taskId: currentTask.id,
        result: resultPayload,
      })
      navigate('/results', { state: { fromWorkspace: true } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save annotation.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderAnnotator = () => {
    if (!template || !currentTask) {
      return null
    }
    switch (template.id) {
      case 'coreference-resolution-and-entity-linking':
        return (
          <CoreferenceAnnotator
            text={(currentTask.payload.corefText as string) ?? ''}
            onChange={handleCoreferenceChange}
          />
        )
      case 'intent-classification-and-slot-filling':
        return (
          <IntentSlotAnnotator
            dialogue={((currentTask.payload.humanMachineDialogue ?? []) as DialogueTurn[]) ?? []}
            onChange={handleIntentChange}
          />
        )
      case 'response-generation':
        return (
          <ResponseGenerator
            dialogue={((currentTask.payload.dialogue ?? []) as DialogueTurn[]) ?? []}
            onChange={handleResponseGenerationChange}
          />
        )
      case 'response-selection':
        return (
          <ResponseSelector
            dialogue={((currentTask.payload.humanMachineDialogue ?? []) as DialogueTurn[]) ?? []}
            options={((currentTask.payload.responseOptions ?? []) as string[]) ?? []}
            onChange={handleResponseSelectionChange}
          />
        )
      default:
        return <p>Template UI is not defined yet for this configuration.</p>
    }
  }

  return (
    <div className="workspace">
      <header className="workspace__header">
        <div className="workspace__title">
          <Link to="/" className="btn btn--ghost">
            ← All templates
          </Link>
          <div>
            <h1>{template?.title ?? 'Loading...'}</h1>
            {template?.group ? <span className="workspace__group">{template.group}</span> : null}
          </div>
        </div>
        <div className="workspace__meta">
          <span>
            Task {Math.min(currentTaskIndex + 1, totalTasks)}/{totalTasks || '—'}
          </span>
          <Link to="/results" className="btn btn--ghost">
            View results
          </Link>
        </div>
      </header>

      {template?.details ? (
        <section className="workspace__details" dangerouslySetInnerHTML={{ __html: template.details }} />
      ) : null}

      {isLoading ? (
        <div className="workspace__loading">
          <span className="spinner" aria-hidden />
          <p>Loading workspace…</p>
        </div>
      ) : (
        renderAnnotator()
      )}

      <footer className="workspace__footer">
        {error ? <p className="workspace__error">{error}</p> : <span />}
        <div className="workspace__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setCurrentTaskIndex((index) => Math.max(index - 1, 0))}
            disabled={currentTaskIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={saveAnnotation}
            disabled={isSaving || !currentTask}
          >
            {isSaving ? 'Saving…' : 'Submit annotation'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              setCurrentTaskIndex((index) => Math.min(index + 1, Math.max(totalTasks - 1, 0)))
            }
            disabled={currentTaskIndex >= totalTasks - 1}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  )
}
