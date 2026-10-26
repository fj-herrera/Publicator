import type { SkillGroup, SkillGroupInput } from '../entities/skill-group'
import { apiMessages } from '../constants/api-messages'
import { getApiError } from './api-error'

export async function getSkillGroups(): Promise<SkillGroup[]> {
  const response = await fetch('/api/skill-groups')

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroups.loadFailed)
  }

  return await response.json() as SkillGroup[]
}

export async function createSkillGroupRequest(
  group: SkillGroupInput,
): Promise<Omit<SkillGroup, 'skills' | 'inPublications'>> {
  const response = await fetch('/api/skill-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroups.createFailed)
  }

  return await response.json() as Omit<SkillGroup, 'skills' | 'inPublications'>
}

export async function updateSkillGroupRequest(
  id: number,
  group: SkillGroupInput,
): Promise<Omit<SkillGroup, 'skills' | 'inPublications'>> {
  const response = await fetch(`/api/skill-groups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroups.updateFailed)
  }

  return await response.json() as Omit<SkillGroup, 'skills' | 'inPublications'>
}

export async function deleteSkillGroupRequest(id: number): Promise<void> {
  const response = await fetch(`/api/skill-groups/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw await getApiError(response, apiMessages.skillGroups.deleteFailed)
  }
}