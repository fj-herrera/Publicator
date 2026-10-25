import type { Context } from '../entities/context'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function getContexts(): Promise<Context[]> {
  const response = await fetch('/api/contexts')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.contexts.loadFailed)
  }

  return await response.json() as Context[]
}

export async function createContextRequest(
  name: string,
): Promise<Omit<Context, 'inPublications'>> {
  const response = await fetch('/api/contexts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.contexts.createFailed)
  }

  return await response.json() as Omit<Context, 'inPublications'>
}

export async function updateContextRequest(
  id: number,
  name: string,
): Promise<Omit<Context, 'inPublications'>> {
  const response = await fetch(`/api/contexts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.contexts.updateFailed)
  }

  return await response.json() as Omit<Context, 'inPublications'>
}

export async function deleteContextRequest(id: number): Promise<void> {
  const response = await fetch(`/api/contexts/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.contexts.deleteFailed)
  }
}