import { useState } from 'react'
import {
  createSkillRequest,
  deleteSkillRequest,
  getSkills,
  updateSkillRequest,
} from '../services/skills.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import { invalidate } from '../state/resource-invalidation'
import type { Skill, SkillInput } from '../entities/skill'
import useResource from './useResource'

function useSkills() {
  const { data, isLoading, error: loadError } = useResource<Skill[]>(
    'skills',
    getSkills,
    apiMessages.skills.loadFailed,
  )
  const [actionError, setActionError] = useState('')

  const createSkill = async (skill: SkillInput): Promise<boolean> => {
    setActionError('')

    try {
      await createSkillRequest(skill)
      invalidate('skills')
      return true
    } catch (createError) {
      setActionError(getErrorMessage(createError, apiMessages.skills.createFailed))
      return false
    }
  }

  const updateSkill = async (id: number, skill: SkillInput): Promise<boolean> => {
    setActionError('')

    try {
      await updateSkillRequest(id, skill)
      invalidate('skills')
      return true
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, apiMessages.skills.updateFailed))
      return false
    }
  }

  const deleteSkill = async (id: number): Promise<boolean> => {
    setActionError('')

    try {
      await deleteSkillRequest(id)
      invalidate('skills')
      return true
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, apiMessages.skills.deleteFailed))
      return false
    }
  }

  return {
    skills: data ?? [],
    isLoading,
    error: actionError || loadError,
    createSkill,
    updateSkill,
    deleteSkill,
    clearError: () => setActionError(''),
  }
}

export default useSkills
