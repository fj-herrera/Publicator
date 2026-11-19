import type { Type } from '../entities/type'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function getTypes(): Promise<Type[]> {
  return requestJson('/api/types', apiMessages.types.loadFailed)
}

export async function createTypeRequest(
  name: string,
): Promise<Omit<Type, 'inPublications'>> {
  return requestJson('/api/types', apiMessages.types.createFailed, jsonRequest('POST', { name }))
}

export async function updateTypeRequest(
  id: number,
  name: string,
): Promise<Omit<Type, 'inPublications'>> {
  return requestJson(`/api/types/${id}`, apiMessages.types.updateFailed, jsonRequest('PATCH', { name }))
}

export async function deleteTypeRequest(id: number): Promise<void> {
  return requestVoid(`/api/types/${id}`, apiMessages.types.deleteFailed, { method: 'DELETE' })
}
