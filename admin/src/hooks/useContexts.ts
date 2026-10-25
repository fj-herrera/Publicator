import { useEffect, useState } from 'react'
import {
  createContextRequest,
  deleteContextRequest,
  getContexts,
  updateContextRequest,
} from '../services/contexts.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import type { Context } from '../entities/context'

function useContexts() {
  const [contexts, setContexts] = useState<Context[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadContexts = async () => {
      try {
        const loadedContexts = await getContexts()
        if (isCurrent) {
          setContexts(loadedContexts)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.contexts.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadContexts()

    return () => {
      isCurrent = false
    }
  }, [])

  const createContext = async (name: string): Promise<boolean> => {
    setError('')

    try {
      const createdContext = await createContextRequest(name)
      setContexts((currentContexts) => [
        ...currentContexts,
        { ...createdContext, inPublications: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, apiMessages.contexts.createFailed))
      return false
    }
  }

  const updateContext = async (id: number, name: string): Promise<boolean> => {
    setError('')

    try {
      const updatedContext = await updateContextRequest(id, name)
      setContexts((currentContexts) => currentContexts.map((context) => (
        context.id === id ? { ...context, ...updatedContext } : context
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, apiMessages.contexts.updateFailed))
      return false
    }
  }

  const deleteContext = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deleteContextRequest(id)
      setContexts((currentContexts) => currentContexts.filter((context) => context.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, apiMessages.contexts.deleteFailed))
      return false
    }
  }

  return {
    contexts,
    isLoading,
    error,
    createContext,
    updateContext,
    deleteContext,
    clearError: () => setError(''),
  }
}

export default useContexts