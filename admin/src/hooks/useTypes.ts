import { useEffect, useState } from 'react'
import {
  createTypeRequest,
  deleteTypeRequest,
  getTypes,
  updateTypeRequest,
} from '../services/types.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import type { Type } from '../entities/type'

function useTypes() {
  const [types, setTypes] = useState<Type[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadTypes = async () => {
      try {
        const loadedTypes = await getTypes()
        if (isCurrent) {
          setTypes(loadedTypes)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.types.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadTypes()

    return () => {
      isCurrent = false
    }
  }, [])

  const createType = async (name: string): Promise<boolean> => {
    setError('')

    try {
      const createdType = await createTypeRequest(name)
      setTypes((currentTypes) => [
        ...currentTypes,
        { ...createdType, inPublications: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, apiMessages.types.createFailed))
      return false
    }
  }

  const updateType = async (id: number, name: string): Promise<boolean> => {
    setError('')

    try {
      const updatedType = await updateTypeRequest(id, name)
      setTypes((currentTypes) => currentTypes.map((type) => (
        type.id === id ? { ...type, ...updatedType } : type
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, apiMessages.types.updateFailed))
      return false
    }
  }

  const deleteType = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deleteTypeRequest(id)
      setTypes((currentTypes) => currentTypes.filter((type) => type.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, apiMessages.types.deleteFailed))
      return false
    }
  }

  return {
    types,
    isLoading,
    error,
    createType,
    updateType,
    deleteType,
    clearError: () => setError(''),
  }
}

export default useTypes