import type { SkillGroupSkill } from '../entities/skill-group-skill'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function getSkillGroupSkills(): Promise<SkillGroupSkill[]> {
  return requestJson('/api/skill-group-skills', apiMessages.skillGroupSkills.loadFailed)
}

export async function addSkillToGroupRequest(
  skillGroupId: number,
  skillId: number,
): Promise<SkillGroupSkill> {
  return requestJson(
    '/api/skill-group-skills',
    apiMessages.skillGroupSkills.addFailed,
    jsonRequest('POST', { skillGroupId, skillId }),
  )
}

export async function removeSkillFromGroupRequest(id: number): Promise<void> {
  return requestVoid(`/api/skill-group-skills/${id}`, apiMessages.skillGroupSkills.removeFailed, { method: 'DELETE' })
}
