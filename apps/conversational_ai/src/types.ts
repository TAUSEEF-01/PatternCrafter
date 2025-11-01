export interface Template {
  id: string
  title: string
  type?: string
  group?: string
  image?: string
  details?: string
  config: string
}

export interface TaskPayload {
  [key: string]: unknown
}

export interface Task {
  id: string
  templateId: string
  payload: TaskPayload
}

export interface Annotation {
  id: string
  templateId: string
  taskId: string
  submittedAt: string
  result: Record<string, unknown>
}

export interface AnnotationCreate {
  templateId: string
  taskId: string
  result: Record<string, unknown>
}
