import type { Client, ClientInput } from '../entities/client'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function uploadClientLogo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/media/clients/logos', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.clients.uploadLogoFailed)
  }

  const result = await response.json() as { url: string }
  return result.url
}

export async function getClients(): Promise<Client[]> {
  const response = await fetch('/api/clients')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.clients.loadFailed)
  }

  return await response.json() as Client[]
}

export async function createClientRequest(
  client: ClientInput,
): Promise<Omit<Client, 'inPublications'>> {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.clients.createFailed)
  }

  return await response.json() as Omit<Client, 'inPublications'>
}

export async function updateClientRequest(
  id: number,
  client: ClientInput,
): Promise<Omit<Client, 'inPublications'>> {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.clients.updateFailed)
  }

  return await response.json() as Omit<Client, 'inPublications'>
}

export async function deleteClientRequest(id: number): Promise<void> {
  const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.clients.deleteFailed)
  }
}