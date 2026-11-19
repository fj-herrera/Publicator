import type { Context } from '../entities/context'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function getContexts(): Promise<Context[]> {
  return requestJson('/api/contexts', apiMessages.contexts.loadFailed)
}

export async function createContextRequest(
  name: string,
): Promise<Omit<Context, 'inPublications'>> {
  return requestJson('/api/contexts', apiMessages.contexts.createFailed, jsonRequest('POST', { name }))
}

export async function updateContextRequest(
  id: number,
  name: string,
): Promise<Omit<Context, 'inPublications'>> {
  return requestJson(`/api/contexts/${id}`, apiMessages.contexts.updateFailed, jsonRequest('PATCH', { name }))
}

export async function deleteContextRequest(id: number): Promise<void> {
  return requestVoid(`/api/contexts/${id}`, apiMessages.contexts.deleteFailed, { method: 'DELETE' })
}
