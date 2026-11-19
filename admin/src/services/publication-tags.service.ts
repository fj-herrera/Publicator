import type { Tag } from '../entities/tag'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function getPublicationTags(): Promise<Tag[]> {
  return requestJson('/api/tags', apiMessages.tags.loadFailed)
}

export async function createPublicationTag(
  name: string,
): Promise<Omit<Tag, 'inPublications'>> {
  return requestJson('/api/tags', apiMessages.tags.createFailed, jsonRequest('POST', { name }))
}

export async function updatePublicationTag(
  id: number,
  name: string,
): Promise<Omit<Tag, 'inPublications'>> {
  return requestJson(`/api/tags/${id}`, apiMessages.tags.updateFailed, jsonRequest('PATCH', { name }))
}

export async function deletePublicationTag(id: number): Promise<void> {
  return requestVoid(`/api/tags/${id}`, apiMessages.tags.deleteFailed, { method: 'DELETE' })
}
