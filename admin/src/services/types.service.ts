import type { Type } from '../entities/type'
import { getApiError } from './api-error'

export async function getTypes(): Promise<Type[]> {
  const response = await fetch('/api/types')

  if (!response.ok) {
    throw await getApiError(response, 'Unable to load types.')
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
    throw await getApiError(response, 'Unable to create type.')
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
    throw await getApiError(response, 'Unable to update type.')
  }

  return await response.json() as Omit<Type, 'inPublications'>
}

export async function deleteTypeRequest(id: number): Promise<void> {
  const response = await fetch(`/api/types/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, 'Unable to delete type.')
  }
}