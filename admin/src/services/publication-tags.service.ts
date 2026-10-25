import type { Tag } from '../entities/tag'
import { getApiError } from './api-error'

export async function getPublicationTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags')

  if (!response.ok) {
    throw await getApiError(response, 'Unable to load tags.')
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
    throw await getApiError(response, 'Unable to create tag.')
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
    throw await getApiError(response, 'Unable to update tag.')
  }

  return await response.json() as Omit<Tag, 'inPublications'>
}

export async function deletePublicationTag(id: number): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, 'Unable to delete tag.')
  }
}