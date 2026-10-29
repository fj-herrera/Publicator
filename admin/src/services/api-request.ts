import { getApiError } from './api-error'

export function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export async function requestJson<T>(path: string, fallback: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw await getApiError(response, fallback)
  }

  return await response.json() as T
}

export async function requestVoid(path: string, fallback: string, init: RequestInit): Promise<void> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw await getApiError(response, fallback)
  }
}
