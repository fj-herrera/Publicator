import { useEffect, useState } from 'react'
import {
  createPublicationType,
  deletePublicationType,
  getPublicationTypes,
  updatePublicationType,
} from '../services/publication-types.service'
import { getErrorMessage } from '../services/api-error'
import type { PublicationType } from '../entities/types/publication-type'

function usePublicationTypes() {
  const [types, setTypes] = useState<PublicationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadTypes = async () => {
      try {
        const loadedTypes = await getPublicationTypes()
        if (isCurrent) {
          setTypes(loadedTypes)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, 'Unable to load publication types.'))
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
      const createdType = await createPublicationType(name)
      setTypes((currentTypes) => [
        ...currentTypes,
        { ...createdType, inPublications: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, 'Unable to create publication type.'))
      return false
    }
  }

  const updateType = async (id: number, name: string): Promise<boolean> => {
    setError('')

    try {
      const updatedType = await updatePublicationType(id, name)
      setTypes((currentTypes) => currentTypes.map((type) => (
        type.id === id ? { ...type, ...updatedType } : type
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Unable to update publication type.'))
      return false
    }
  }

  const deleteType = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deletePublicationType(id)
      setTypes((currentTypes) => currentTypes.filter((type) => type.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete publication type.'))
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

export default usePublicationTypes