import { useEffect, useState } from 'react'
import {
  createTypeRequest,
  deleteTypeRequest,
  getTypes,
  updateTypeRequest,
} from '../services/types.service'
import { getErrorMessage } from '../services/api-error'
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
          setError(getErrorMessage(loadError, 'Unable to load types.'))
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
      setError(getErrorMessage(createError, 'Unable to create type.'))
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
      setError(getErrorMessage(updateError, 'Unable to update type.'))
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
      setError(getErrorMessage(deleteError, 'Unable to delete type.'))
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