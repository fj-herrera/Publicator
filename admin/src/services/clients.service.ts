import type { Client, ClientInput } from '../entities/client'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function uploadClientLogo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const result = await requestJson<{ url: string }>('/api/media/clients/logos', apiMessages.clients.uploadLogoFailed, {
    method: 'POST',
    body: formData,
  })
  return result.url
}

export async function getClients(): Promise<Client[]> {
  return requestJson('/api/clients', apiMessages.clients.loadFailed)
}

export async function createClientRequest(
  client: ClientInput,
): Promise<Omit<Client, 'inPublications'>> {
  return requestJson('/api/clients', apiMessages.clients.createFailed, jsonRequest('POST', client))
}

export async function updateClientRequest(
  id: number,
  client: ClientInput,
): Promise<Omit<Client, 'inPublications'>> {
  return requestJson(`/api/clients/${id}`, apiMessages.clients.updateFailed, jsonRequest('PATCH', client))
}

export async function deleteClientRequest(id: number): Promise<void> {
  return requestVoid(`/api/clients/${id}`, apiMessages.clients.deleteFailed, { method: 'DELETE' })
}
