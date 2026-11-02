import { useCallback, useState } from 'react'
import type { Skill } from '../entities/skill'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import {
  addSkillToGroupRequest,
  getSkillGroupSkills,
  removeSkillFromGroupRequest,
} from '../services/skill-group-skills.service'
import { invalidate } from '../state/resource-invalidation'
import useResource from './useResource'

function useSkillGroupMembership(skillGroupId: number) {
  const loadMemberships = useCallback(async () => (
    (await getSkillGroupSkills()).filter(
      (membership) => membership.skillGroup.id === skillGroupId,
    )
  ), [skillGroupId])
  const {
    data,
    isLoading,
    isRefreshing,
    error: loadError,
  } = useResource('skillGroupSkills', loadMemberships, apiMessages.skillGroupSkills.loadFailed)
  const [actionError, setActionError] = useState('')
  const memberships = data ?? []

  const addSkills = async (skillIds: number[]): Promise<number[]> => {
    setActionError('')
    const addedSkillIds: number[] = []

    try {
      for (const skillId of skillIds) {
        try {
          await addSkillToGroupRequest(skillGroupId, skillId)
          addedSkillIds.push(skillId)
        } catch (addError) {
          setActionError(getErrorMessage(addError, apiMessages.skillGroupSkills.addFailed))
          break
        }
      }
    } finally {
      if (addedSkillIds.length > 0) invalidate('skillGroupSkills')
    }

    return addedSkillIds
  }

  const removeSkills = async (skillIds: number[]): Promise<number[]> => {
    setActionError('')
    const removedSkillIds: number[] = []

    try {
      for (const skillId of skillIds) {
        const membership = memberships.find((item) => item.skill.id === skillId)
        if (!membership) continue

        try {
          await removeSkillFromGroupRequest(membership.id)
          removedSkillIds.push(skillId)
        } catch (removeError) {
          setActionError(getErrorMessage(removeError, apiMessages.skillGroupSkills.removeFailed))
          break
        }
      }
    } finally {
      if (removedSkillIds.length > 0) invalidate('skillGroupSkills')
    }

    return removedSkillIds
  }

  const assignedSkills: Skill[] = memberships.map((membership) => membership.skill)

  return {
    assignedSkills,
    isLoading,
    isRefreshing,
    error: actionError || loadError,
    addSkills,
    removeSkills,
    clearError: () => setActionError(''),
  }
}

export default useSkillGroupMembership
