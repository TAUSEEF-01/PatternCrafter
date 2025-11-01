import type { Annotation, AnnotationCreate } from '../types'

const STORAGE_KEY = 'conversational-ai-annotations'

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `annotation-${Math.random().toString(16).slice(2)}`
}

function readStore(): Annotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as Annotation[]
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

function writeStore(items: Annotation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Fail silently if storage is unavailable (e.g., privacy mode).
  }
}

export function loadAnnotations(): Annotation[] {
  return readStore()
}

export function appendAnnotation(payload: AnnotationCreate): Annotation {
  const items = readStore()
  const annotation: Annotation = {
    id: generateId(),
    templateId: payload.templateId,
    taskId: payload.taskId,
    result: payload.result,
    submittedAt: new Date().toISOString(),
  }
  items.push(annotation)
  writeStore(items)
  return annotation
}

export function clearAnnotations() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
