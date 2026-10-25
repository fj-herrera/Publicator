import { useEffect, useState } from 'react'
import {
  createPublicationTag,
  deletePublicationTag,
  getPublicationTags,
  updatePublicationTag,
} from '../services/publication-tags.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import type { Tag } from '../entities/tag'

function usePublicationTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadTags = async () => {
      try {
        const loadedTags = await getPublicationTags()
        if (isCurrent) {
          setTags(loadedTags)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.tags.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadTags()

    return () => {
      isCurrent = false
    }
  }, [])

  const createTag = async (name: string): Promise<boolean> => {
    setError('')

    try {
      const createdTag = await createPublicationTag(name)
      setTags((currentTags) => [
        ...currentTags,
        { ...createdTag, inPublications: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, apiMessages.tags.createFailed))
      return false
    }
  }

  const updateTag = async (id: number, name: string): Promise<boolean> => {
    setError('')

    try {
      const updatedTag = await updatePublicationTag(id, name)
      setTags((currentTags) => currentTags.map((tag) => (
        tag.id === id ? { ...tag, ...updatedTag } : tag
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, apiMessages.tags.updateFailed))
      return false
    }
  }

  const deleteTag = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deletePublicationTag(id)
      setTags((currentTags) => currentTags.filter((tag) => tag.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, apiMessages.tags.deleteFailed))
      return false
    }
  }

  return {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    clearError: () => setError(''),
  }
}

export default usePublicationTags