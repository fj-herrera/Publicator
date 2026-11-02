import { useState } from 'react'
import {
  createTypeRequest,
  deleteTypeRequest,
  getTypes,
  updateTypeRequest,
} from '../services/types.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import { invalidate } from '../state/resource-invalidation'
import type { Type } from '../entities/type'
import useResource from './useResource'

function useTypes() {
  const { data, isLoading, error: loadError } = useResource<Type[]>(
    'types',
    getTypes,
    apiMessages.types.loadFailed,
  )
  const [actionError, setActionError] = useState('')

  const createType = async (name: string): Promise<boolean> => {
    setActionError('')

    try {
      await createTypeRequest(name)
      invalidate('types')
      return true
    } catch (createError) {
      setActionError(getErrorMessage(createError, apiMessages.types.createFailed))
      return false
    }
  }

  const updateType = async (id: number, name: string): Promise<boolean> => {
    setActionError('')

    try {
      await updateTypeRequest(id, name)
      invalidate('types')
      return true
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, apiMessages.types.updateFailed))
      return false
    }
  }

  const deleteType = async (id: number): Promise<boolean> => {
    setActionError('')

    try {
      await deleteTypeRequest(id)
      invalidate('types')
      return true
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, apiMessages.types.deleteFailed))
      return false
    }
  }

  return {
    types: data ?? [],
    isLoading,
    error: actionError || loadError,
    createType,
    updateType,
    deleteType,
    clearError: () => setActionError(''),
  }
}

export default useTypes
