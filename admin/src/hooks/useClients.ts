import { useState } from 'react'
import {
  createClientRequest,
  deleteClientRequest,
  getClients,
  updateClientRequest,
} from '../services/clients.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import { invalidate } from '../state/resource-invalidation'
import type { Client, ClientInput } from '../entities/client'
import useResource from './useResource'

function useClients() {
  const { data, isLoading, error: loadError } = useResource<Client[]>(
    'clients',
    getClients,
    apiMessages.clients.loadFailed,
  )
  const [actionError, setActionError] = useState('')

  const createClient = async (client: ClientInput): Promise<boolean> => {
    setActionError('')

    try {
      await createClientRequest(client)
      invalidate('clients')
      return true
    } catch (createError) {
      setActionError(getErrorMessage(createError, apiMessages.clients.createFailed))
      return false
    }
  }

  const updateClient = async (id: number, client: ClientInput): Promise<boolean> => {
    setActionError('')

    try {
      await updateClientRequest(id, client)
      invalidate('clients')
      return true
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, apiMessages.clients.updateFailed))
      return false
    }
  }

  const deleteClient = async (id: number): Promise<boolean> => {
    setActionError('')

    try {
      await deleteClientRequest(id)
      invalidate('clients')
      return true
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, apiMessages.clients.deleteFailed))
      return false
    }
  }

  return {
    clients: data ?? [],
    isLoading,
    error: actionError || loadError,
    createClient,
    updateClient,
    deleteClient,
    clearError: () => setActionError(''),
  }
}

export default useClients
