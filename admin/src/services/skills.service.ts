import type { Skill, SkillInput } from '../entities/skill'
import { apiMessages } from '../constants/api-messages'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export async function uploadSkillIcon(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const result = await requestJson<{ url: string }>('/api/media/skills', apiMessages.skills.uploadIconFailed, {
    method: 'POST',
    body: formData,
  })
  return result.url
}

export async function getSkills(): Promise<Skill[]> {
  return requestJson('/api/skills', apiMessages.skills.loadFailed)
}

export async function createSkillRequest(
  skill: SkillInput,
): Promise<Omit<Skill, 'inSkillGroups'>> {
  return requestJson('/api/skills', apiMessages.skills.createFailed, jsonRequest('POST', skill))
}

export async function updateSkillRequest(
  id: number,
  skill: SkillInput,
): Promise<Omit<Skill, 'inSkillGroups'>> {
  return requestJson(`/api/skills/${id}`, apiMessages.skills.updateFailed, jsonRequest('PATCH', skill))
}

export async function deleteSkillRequest(id: number): Promise<void> {
  return requestVoid(`/api/skills/${id}`, apiMessages.skills.deleteFailed, { method: 'DELETE' })
}
