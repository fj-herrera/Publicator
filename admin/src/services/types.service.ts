import type { Type } from '../entities/type'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function getTypes(): Promise<Type[]> {
  const response = await fetch('/api/types')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.types.loadFailed)
  }

  return await response.json() as Type[]
}

export async function createTypeRequest(
  name: string,
): Promise<Omit<Type, 'inPublications'>> {
  const response = await fetch('/api/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.types.createFailed)
  }

  return await response.json() as Omit<Type, 'inPublications'>
}

export async function updateTypeRequest(
  id: number,
  name: string,
): Promise<Omit<Type, 'inPublications'>> {
  const response = await fetch(`/api/types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.types.updateFailed)
  }

  return await response.json() as Omit<Type, 'inPublications'>
}

export async function deleteTypeRequest(id: number): Promise<void> {
  const response = await fetch(`/api/types/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.types.deleteFailed)
  }
}