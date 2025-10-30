import type { Annotation, AnnotationCreate, Task, Template } from '../types';
import { mockTemplates, mockTasks } from './mockData';
import { appendAnnotation, loadAnnotations } from './annotationStore';

const DEFAULT_BASE_URL = 'http://localhost:8000';

const MODE = ((import.meta.env.VITE_API_MODE ?? '') as string).toLowerCase();
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;
const USE_REMOTE_API =
  MODE === 'remote' || (MODE !== 'mock' && Boolean(import.meta.env.VITE_API_BASE_URL));

function getToken(): string | null {
  try {
    return localStorage.getItem('pc_token');
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // ignore parse error; fall back to default message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

export function fetchTemplates(): Promise<Template[]> {
  if (USE_REMOTE_API) {
    return request<Template[]>('/api/templates');
  }
  return Promise.resolve(mockTemplates);
}

export function fetchTemplate(templateId: string): Promise<Template> {
  if (USE_REMOTE_API) {
    return request<Template>(`/api/templates/${templateId}`);
  }
  const template = mockTemplates.find((item) => item.id === templateId);
  if (!template) {
    return Promise.reject(new Error('Template not found.'));
  }
  return Promise.resolve(template);
}

export function fetchTasks(templateId?: string): Promise<Task[]> {
  if (USE_REMOTE_API) {
    const path = templateId ? `/api/templates/${templateId}/tasks` : '/api/tasks';
    return request<Task[]>(path);
  }

  if (!templateId) {
    return Promise.resolve(mockTasks);
  }
  return Promise.resolve(mockTasks.filter((task) => task.templateId === templateId));
}

export function submitAnnotation(payload: AnnotationCreate): Promise<Annotation> {
  if (USE_REMOTE_API) {
    return request<Annotation>('/api/annotations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  const annotation = appendAnnotation(payload);
  return Promise.resolve(annotation);
}

export function fetchAnnotations(): Promise<{ items: Annotation[] }> {
  if (USE_REMOTE_API) {
    return request<{ items: Annotation[] }>('/api/annotations');
  }
  return Promise.resolve({ items: loadAnnotations() });
}
