import type { Skill, SkillInput } from '../entities/skill'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function uploadSkillIcon(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/media/skills/icons', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skills.uploadIconFailed)
  }

  const result = await response.json() as { url: string }
  return result.url
}

export async function getSkills(): Promise<Skill[]> {
  const response = await fetch('/api/skills')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skills.loadFailed)
  }

  return await response.json() as Skill[]
}

export async function createSkillRequest(
  skill: SkillInput,
): Promise<Omit<Skill, 'inSkillGroups'>> {
  const response = await fetch('/api/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skill),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skills.createFailed)
  }

  return await response.json() as Omit<Skill, 'inSkillGroups'>
}

export async function updateSkillRequest(
  id: number,
  skill: SkillInput,
): Promise<Omit<Skill, 'inSkillGroups'>> {
  const response = await fetch(`/api/skills/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skill),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skills.updateFailed)
  }

  return await response.json() as Omit<Skill, 'inSkillGroups'>
}

export async function deleteSkillRequest(id: number): Promise<void> {
  const response = await fetch(`/api/skills/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skills.deleteFailed)
  }
}