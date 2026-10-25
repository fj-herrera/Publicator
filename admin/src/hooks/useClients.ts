import { useEffect, useState } from 'react'
import {
  createClientRequest,
  deleteClientRequest,
  getClients,
  updateClientRequest,
} from '../services/clients.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import type { Client, ClientInput } from '../entities/client'

function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadClients = async () => {
      try {
        const loadedClients = await getClients()
        if (isCurrent) {
          setClients(loadedClients)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.clients.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadClients()

    return () => {
      isCurrent = false
    }
  }, [])

  const createClient = async (client: ClientInput): Promise<boolean> => {
    setError('')

    try {
      const createdClient = await createClientRequest(client)
      setClients((currentClients) => [
        ...currentClients,
        { ...createdClient, inPublications: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, apiMessages.clients.createFailed))
      return false
    }
  }

  const updateClient = async (id: number, client: ClientInput): Promise<boolean> => {
    setError('')

    try {
      const updatedClient = await updateClientRequest(id, client)
      setClients((currentClients) => currentClients.map((currentClient) => (
        currentClient.id === id ? { ...currentClient, ...updatedClient } : currentClient
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, apiMessages.clients.updateFailed))
      return false
    }
  }

  const deleteClient = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deleteClientRequest(id)
      setClients((currentClients) => currentClients.filter((client) => client.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, apiMessages.clients.deleteFailed))
      return false
    }
  }

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    clearError: () => setError(''),
  }
}

export default useClients