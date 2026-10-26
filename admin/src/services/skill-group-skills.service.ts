import type { SkillGroupSkill } from '../entities/skill-group-skill'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function getSkillGroupSkills(): Promise<SkillGroupSkill[]> {
  const response = await fetch('/api/skill-group-skills')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroupSkills.loadFailed)
  }

  return await response.json() as SkillGroupSkill[]
}

export async function addSkillToGroupRequest(
  skillGroupId: number,
  skillId: number,
): Promise<SkillGroupSkill> {
  const response = await fetch('/api/skill-group-skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skillGroupId, skillId }),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroupSkills.addFailed)
  }

  return await response.json() as SkillGroupSkill
}

export async function removeSkillFromGroupRequest(id: number): Promise<void> {
  const response = await fetch(`/api/skill-group-skills/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroupSkills.removeFailed)
  }
}