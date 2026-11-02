import { useState } from 'react'
import {
  createContextRequest,
  deleteContextRequest,
  getContexts,
  updateContextRequest,
} from '../services/contexts.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import { invalidate } from '../state/resource-invalidation'
import type { Context } from '../entities/context'
import useResource from './useResource'

function useContexts() {
  const { data, isLoading, error: loadError } = useResource<Context[]>(
    'contexts',
    getContexts,
    apiMessages.contexts.loadFailed,
  )
  const [actionError, setActionError] = useState('')

  const createContext = async (name: string): Promise<boolean> => {
    setActionError('')

    try {
      await createContextRequest(name)
      invalidate('contexts')
      return true
    } catch (createError) {
      setActionError(getErrorMessage(createError, apiMessages.contexts.createFailed))
      return false
    }
  }

  const updateContext = async (id: number, name: string): Promise<boolean> => {
    setActionError('')

    try {
      await updateContextRequest(id, name)
      invalidate('contexts')
      return true
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, apiMessages.contexts.updateFailed))
      return false
    }
  }

  const deleteContext = async (id: number): Promise<boolean> => {
    setActionError('')

    try {
      await deleteContextRequest(id)
      invalidate('contexts')
      return true
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, apiMessages.contexts.deleteFailed))
      return false
    }
  }

  return {
    contexts: data ?? [],
    isLoading,
    error: actionError || loadError,
    createContext,
    updateContext,
    deleteContext,
    clearError: () => setActionError(''),
  }
}

export default useContexts
