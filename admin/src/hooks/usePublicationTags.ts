import { useState } from 'react'
import {
  createPublicationTag,
  deletePublicationTag,
  getPublicationTags,
  updatePublicationTag,
} from '../services/publication-tags.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import { invalidate } from '../state/resource-invalidation'
import type { Tag } from '../entities/tag'
import useResource from './useResource'

function usePublicationTags() {
  const { data, isLoading, error: loadError } = useResource<Tag[]>(
    'tags',
    getPublicationTags,
    apiMessages.tags.loadFailed,
  )
  const [actionError, setActionError] = useState('')

  const createTag = async (name: string): Promise<boolean> => {
    setActionError('')

    try {
      await createPublicationTag(name)
      invalidate('tags')
      return true
    } catch (createError) {
      setActionError(getErrorMessage(createError, apiMessages.tags.createFailed))
      return false
    }
  }

  const updateTag = async (id: number, name: string): Promise<boolean> => {
    setActionError('')

    try {
      await updatePublicationTag(id, name)
      invalidate('tags')
      return true
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, apiMessages.tags.updateFailed))
      return false
    }
  }

  const deleteTag = async (id: number): Promise<boolean> => {
    setActionError('')

    try {
      await deletePublicationTag(id)
      invalidate('tags')
      return true
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, apiMessages.tags.deleteFailed))
      return false
    }
  }

  return {
    tags: data ?? [],
    isLoading,
    error: actionError || loadError,
    createTag,
    updateTag,
    deleteTag,
    clearError: () => setActionError(''),
  }
}

export default usePublicationTags
