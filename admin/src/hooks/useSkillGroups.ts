import { useEffect, useState } from 'react'
import {
  createSkillGroupRequest,
  deleteSkillGroupRequest,
  getSkillGroups,
  updateSkillGroupRequest,
} from '../services/skill-groups.service'
import { getErrorMessage } from '../services/api-error'
import { apiMessages } from '../constants/api-messages'
import type { SkillGroup, SkillGroupInput } from '../entities/skill-group'

function useSkillGroups() {
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadSkillGroups = async () => {
      try {
        const loadedSkillGroups = await getSkillGroups()
        if (isCurrent) {
          setSkillGroups(loadedSkillGroups)
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.skillGroups.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadSkillGroups()

    return () => {
      isCurrent = false
    }
  }, [])

  const createSkillGroup = async (group: SkillGroupInput): Promise<boolean> => {
    setError('')

    try {
      const createdGroup = await createSkillGroupRequest(group)
      setSkillGroups((currentGroups) => [
        ...currentGroups,
        { ...createdGroup, skills: [], inPublications: 0 },
      ])
      return true
    } catch (createError) {
      setError(getErrorMessage(createError, apiMessages.skillGroups.createFailed))
      return false
    }
  }

  const updateSkillGroup = async (id: number, group: SkillGroupInput): Promise<boolean> => {
    setError('')

    try {
      const updatedGroup = await updateSkillGroupRequest(id, group)
      setSkillGroups((currentGroups) => currentGroups.map((currentGroup) => (
        currentGroup.id === id ? { ...currentGroup, ...updatedGroup } : currentGroup
      )))
      return true
    } catch (updateError) {
      setError(getErrorMessage(updateError, apiMessages.skillGroups.updateFailed))
      return false
    }
  }

  const deleteSkillGroup = async (id: number): Promise<boolean> => {
    setError('')

    try {
      await deleteSkillGroupRequest(id)
      setSkillGroups((currentGroups) => currentGroups.filter((group) => group.id !== id))
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, apiMessages.skillGroups.deleteFailed))
      return false
    }
  }

  const refreshSkillGroups = async (): Promise<void> => {
    try {
      setSkillGroups(await getSkillGroups())
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError, apiMessages.skillGroups.loadFailed))
    }
  }

  return {
    skillGroups,
    isLoading,
    error,
    createSkillGroup,
    updateSkillGroup,
    deleteSkillGroup,
    refreshSkillGroups,
    clearError: () => setError(''),
  }
}

export default useSkillGroups