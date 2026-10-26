import { useEffect, useState } from 'react'
import {
  createSkillRequest,
  deleteSkillRequest,
  getSkills,
  updateSkillRequest,
} from '../services/skills.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import type { Skill, SkillInput } from '../entities/skill'

function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadSkills = async () => {
      try {
        const loadedSkills = await getSkills()
        if (isCurrent) {
          setSkills(loadedSkills)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.skills.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadSkills()

    return () => {
      isCurrent = false
    }
  }, [])

  const createSkill = async (skill: SkillInput): Promise<boolean> => {
    setError('')

    try {
      const createdSkill = await createSkillRequest(skill)
      setSkills((currentSkills) => [
        ...currentSkills,
        { ...createdSkill, inSkillGroups: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, apiMessages.skills.createFailed))
      return false
    }
  }

  const updateSkill = async (id: number, skill: SkillInput): Promise<boolean> => {
    setError('')

    try {
      const updatedSkill = await updateSkillRequest(id, skill)
      setSkills((currentSkills) => currentSkills.map((currentSkill) => (
        currentSkill.id === id ? { ...currentSkill, ...updatedSkill } : currentSkill
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, apiMessages.skills.updateFailed))
      return false
    }
  }

  const deleteSkill = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deleteSkillRequest(id)
      setSkills((currentSkills) => currentSkills.filter((skill) => skill.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, apiMessages.skills.deleteFailed))
      return false
    }
  }

  return {
    skills,
    isLoading,
    error,
    createSkill,
    updateSkill,
    deleteSkill,
    clearError: () => setError(''),
  }
}

export default useSkills