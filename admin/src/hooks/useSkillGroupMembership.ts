import { useEffect, useState } from 'react'
import type { SkillGroupSkill } from '../entities/skill-group-skill'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import {
  addSkillToGroupRequest,
  getSkillGroupSkills,
  removeSkillFromGroupRequest,
} from '../services/skill-group-skills.service'

function useSkillGroupMembership(skillGroupId: number) {
  const [memberships, setMemberships] = useState<SkillGroupSkill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadMemberships = async () => {
      try {
        const allMemberships = await getSkillGroupSkills()
        if (isCurrent) {
          setMemberships(allMemberships.filter(
            (membership) => membership.skillGroup.id === skillGroupId,
          ))
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.skillGroupSkills.loadFailed))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadMemberships()

    return () => {
      isCurrent = false
    }
  }, [skillGroupId])

  const addSkills = async (skillIds: number[]): Promise<number[]> => {
    setError('')
    const addedSkillIds: number[] = []

    for (const skillId of skillIds) {
      try {
        const membership = await addSkillToGroupRequest(skillGroupId, skillId)
        setMemberships((current) => [...current, membership])
        addedSkillIds.push(skillId)
      } catch (addError) {
        setError(getErrorMessage(addError, apiMessages.skillGroupSkills.addFailed))
        break
      }
    }

    return addedSkillIds
  }

  const removeSkills = async (skillIds: number[]): Promise<number[]> => {
    setError('')
    const removedSkillIds: number[] = []

    for (const skillId of skillIds) {
      const membership = memberships.find((item) => item.skill.id === skillId)
      if (!membership) continue

      try {
        await removeSkillFromGroupRequest(membership.id)
        setMemberships((current) => current.filter((item) => item.id !== membership.id))
        removedSkillIds.push(skillId)
      } catch (removeError) {
        setError(getErrorMessage(removeError, apiMessages.skillGroupSkills.removeFailed))
        break
      }
    }

    return removedSkillIds
  }

  const assignedSkills = memberships.map((membership) => membership.skill)

  return {
    assignedSkills,
    isLoading,
    error,
    addSkills,
    removeSkills,
    clearError: () => setError(''),
  }
}

export default useSkillGroupMembership