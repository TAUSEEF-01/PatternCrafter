export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiFetch<T = any>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    noAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, noAuth = false } = options;

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const token = getToken();

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !noAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return (await res.text()) as unknown as T;
}
