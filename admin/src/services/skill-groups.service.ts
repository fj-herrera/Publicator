import type { SkillGroup, SkillGroupInput } from '../entities/skill-group'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function getSkillGroups(): Promise<SkillGroup[]> {
  return requestJson('/api/skill-groups', apiMessages.skillGroups.loadFailed)
}

export async function createSkillGroupRequest(
  group: SkillGroupInput,
): Promise<Omit<SkillGroup, 'skills' | 'inPublications'>> {
  return requestJson('/api/skill-groups', apiMessages.skillGroups.createFailed, jsonRequest('POST', group))
}

export async function updateSkillGroupRequest(
  id: number,
  group: SkillGroupInput,
): Promise<Omit<SkillGroup, 'skills' | 'inPublications'>> {
  return requestJson(`/api/skill-groups/${id}`, apiMessages.skillGroups.updateFailed, jsonRequest('PATCH', group))
}

export async function deleteSkillGroupRequest(id: number): Promise<void> {
  return requestVoid(`/api/skill-groups/${id}`, apiMessages.skillGroups.deleteFailed, { method: 'DELETE' })
}
