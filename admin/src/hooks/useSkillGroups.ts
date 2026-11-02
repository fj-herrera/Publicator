import { useState } from 'react'
import {
  createSkillGroupRequest,
  deleteSkillGroupRequest,
  getSkillGroups,
  updateSkillGroupRequest,
} from '../services/skill-groups.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import { invalidate } from '../state/resource-invalidation'
import type { SkillGroup, SkillGroupInput } from '../entities/skill-group'
import useResource from './useResource'

function useSkillGroups() {
  const { data, isLoading, error: loadError } = useResource<SkillGroup[]>(
    'skillGroups',
    getSkillGroups,
    apiMessages.skillGroups.loadFailed,
  )
  const [actionError, setActionError] = useState('')

  const createSkillGroup = async (group: SkillGroupInput): Promise<boolean> => {
    setActionError('')

    try {
      await createSkillGroupRequest(group)
      invalidate('skillGroups')
      return true
    } catch (createError) {
      setActionError(getErrorMessage(createError, apiMessages.skillGroups.createFailed))
      return false
    }
  }

  const updateSkillGroup = async (id: number, group: SkillGroupInput): Promise<boolean> => {
    setActionError('')

    try {
      await updateSkillGroupRequest(id, group)
      invalidate('skillGroups')
      return true
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, apiMessages.skillGroups.updateFailed))
      return false
    }
  }

  const deleteSkillGroup = async (id: number): Promise<boolean> => {
    setActionError('')

    try {
      await deleteSkillGroupRequest(id)
      invalidate('skillGroups')
      return true
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, apiMessages.skillGroups.deleteFailed))
      return false
    }
  }

  return {
    skillGroups: data ?? [],
    isLoading,
    error: actionError || loadError,
    createSkillGroup,
    updateSkillGroup,
    deleteSkillGroup,
    clearError: () => setActionError(''),
  }
}

export default useSkillGroups
