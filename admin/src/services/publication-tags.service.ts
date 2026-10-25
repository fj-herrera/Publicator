import type { Tag } from '../entities/tag'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function getPublicationTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.tags.loadFailed)
  }

  return await response.json() as Tag[]
}

export async function createPublicationTag(
  name: string,
): Promise<Omit<Tag, 'inPublications'>> {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.tags.createFailed)
  }

  return await response.json() as Omit<Tag, 'inPublications'>
}

export async function updatePublicationTag(
  id: number,
  name: string,
): Promise<Omit<Tag, 'inPublications'>> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.tags.updateFailed)
  }

  return await response.json() as Omit<Tag, 'inPublications'>
}

export async function deletePublicationTag(id: number): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.tags.deleteFailed)
  }
}