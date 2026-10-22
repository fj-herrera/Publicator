import type { PublicationType } from '../entities/types/publication-type'
import { getApiError } from './api-error'

export async function getPublicationTypes(): Promise<PublicationType[]> {
  const response = await fetch('/api/types')

  if (!response.ok) {
    throw await getApiError(response, 'Unable to load publication types.')
  }

  return await response.json() as PublicationType[]
}

export async function createPublicationType(
  name: string,
): Promise<Omit<PublicationType, 'inPublications'>> {
  const response = await fetch('/api/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, 'Unable to create publication type.')
  }

  return await response.json() as Omit<PublicationType, 'inPublications'>
}

export async function updatePublicationType(
  id: number,
  name: string,
): Promise<Omit<PublicationType, 'inPublications'>> {
  const response = await fetch(`/api/types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, 'Unable to update publication type.')
  }

  return await response.json() as Omit<PublicationType, 'inPublications'>
}

export async function deletePublicationType(id: number): Promise<void> {
  const response = await fetch(`/api/types/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, 'Unable to delete publication type.')
  }
}