import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  requests,
  resetBackend,
} from '../test/fake-skills-backend'
import useSkillGroupMembership from './useSkillGroupMembership'
import useSkillGroups from './useSkillGroups'
import useSkills from './useSkills'

vi.mock('../services/skills.service', async () => (await import('../test/fake-skills-backend')).skillsService)
vi.mock('../services/skill-groups.service', async () => (await import('../test/fake-skills-backend')).skillGroupsService)
vi.mock('../services/skill-group-skills.service', async () => (await import('../test/fake-skills-backend')).skillGroupSkillsService)

const seed = () => resetBackend({
  skills: [
    { id: 1, name: 'React', icon: null },
    { id: 2, name: 'NestJS', icon: null },
    { id: 3, name: 'Unused', icon: null },
  ],
  groups: [
    { id: 10, name: 'Frontend', description: null },
    { id: 11, name: 'Backend', description: null },
  ],
  memberships: [
    { id: 100, groupId: 10, skillId: 1 },
    { id: 101, groupId: 11, skillId: 1 },
    { id: 102, groupId: 11, skillId: 2 },
  ],
})

// The three hooks Skills.tsx and SkillGroups.tsx combine, mounted in one tree.
const renderSkillsScreen = async (managedGroupId = 10) => {
  const view = renderHook(() => ({
    skills: useSkills(),
    groups: useSkillGroups(),
    membership: useSkillGroupMembership(managedGroupId),
  }))
  await waitFor(() => {
    expect(view.result.current.skills.isLoading).toBe(false)
    expect(view.result.current.groups.isLoading).toBe(false)
    expect(view.result.current.membership.isLoading).toBe(false)
  })
  return view
}

const counterOf = (skills: { id: number; inSkillGroups: number }[], id: number) => (
  skills.find((skill) => skill.id === id)?.inSkillGroups
)

describe('Skills screen synchronisation', () => {
  beforeEach(seed)

  it('deleting a group updates inSkillGroups of its skills right away', async () => {
    const { result } = await renderSkillsScreen()
    expect(counterOf(result.current.skills.skills, 1)).toBe(2)
    expect(counterOf(result.current.skills.skills, 2)).toBe(1)

    await act(async () => {
      await result.current.groups.deleteSkillGroup(11)
    })

    await waitFor(() => expect(counterOf(result.current.skills.skills, 1)).toBe(1))
    expect(counterOf(result.current.skills.skills, 2)).toBe(0)
    expect(result.current.groups.skillGroups.map((group) => group.id)).toEqual([10])
  })

  it('adding skills to a group updates both views and the group membership', async () => {
    const { result } = await renderSkillsScreen()

    await act(async () => {
      await result.current.membership.addSkills([2, 3])
    })

    await waitFor(() => expect(counterOf(result.current.skills.skills, 3)).toBe(1))
    expect(counterOf(result.current.skills.skills, 2)).toBe(2)
    const frontend = result.current.groups.skillGroups.find((group) => group.id === 10)
    expect(frontend?.skills.map((skill) => skill.id)).toEqual([1, 2, 3])
    expect(result.current.membership.assignedSkills.map((skill) => skill.id)).toEqual([1, 2, 3])
  })

  it('removing skills from a group updates both views and the group membership', async () => {
    const { result } = await renderSkillsScreen(11)

    await act(async () => {
      await result.current.membership.removeSkills([1, 2])
    })

    await waitFor(() => expect(counterOf(result.current.skills.skills, 2)).toBe(0))
    expect(counterOf(result.current.skills.skills, 1)).toBe(1)
    const backend = result.current.groups.skillGroups.find((group) => group.id === 11)
    expect(backend?.skills).toEqual([])
    expect(result.current.membership.assignedSkills).toEqual([])
  })

  it('deleting a skill removes it from the skills view and keeps group lists consistent', async () => {
    const { result } = await renderSkillsScreen()

    await act(async () => {
      await result.current.skills.deleteSkill(3)
    })

    await waitFor(() => expect(result.current.skills.skills.map((skill) => skill.id)).toEqual([1, 2]))
    expect(result.current.groups.skillGroups.map((group) => group.skills.map((skill) => skill.id)))
      .toEqual([[1], [1, 2]])
  })

  it('a skill that still belongs to a group is not deleted and nothing is invalidated', async () => {
    const { result } = await renderSkillsScreen()
    const before = { ...requests }
    let deleted = true

    await act(async () => {
      deleted = await result.current.skills.deleteSkill(1)
    })

    expect(deleted).toBe(false)
    expect(result.current.skills.error).toMatch(/belongs to a skill group/)
    expect(result.current.skills.skills.map((skill) => skill.id)).toEqual([1, 2, 3])
    expect(requests).toEqual(before)
  })

  it('renaming a skill is reflected in the group lists', async () => {
    const { result } = await renderSkillsScreen()

    await act(async () => {
      await result.current.skills.updateSkill(1, { name: 'React 19', icon: null })
    })

    await waitFor(() => {
      const frontend = result.current.groups.skillGroups.find((group) => group.id === 10)
      expect(frontend?.skills[0].name).toBe('React 19')
    })
    expect(result.current.membership.assignedSkills[0].name).toBe('React 19')
  })

  it('creating a group and a skill shows them without reloading the page', async () => {
    const { result } = await renderSkillsScreen()

    await act(async () => {
      await result.current.groups.createSkillGroup({ name: 'Ops', description: null })
      await result.current.skills.createSkill({ name: 'Docker', icon: null })
    })

    await waitFor(() => {
      expect(result.current.groups.skillGroups.map((group) => group.name)).toContain('Ops')
      expect(result.current.skills.skills.map((skill) => skill.name)).toContain('Docker')
    })
  })

  it('does not reload with a loading state and fetches each resource once per write', async () => {
    const { result } = await renderSkillsScreen()
    const before = { ...requests }
    const loadingStates: boolean[] = []

    await act(async () => {
      await result.current.groups.deleteSkillGroup(11)
      loadingStates.push(
        result.current.skills.isLoading,
        result.current.groups.isLoading,
        result.current.membership.isLoading,
      )
    })

    await waitFor(() => expect(counterOf(result.current.skills.skills, 2)).toBe(0))
    expect(loadingStates).toEqual([false, false, false])
    expect(requests.skills - before.skills).toBe(1)
    expect(requests.skillGroups - before.skillGroups).toBe(1)
    expect(requests.skillGroupSkills - before.skillGroupSkills).toBe(1)
  })

  it('a batch of additions triggers a single reload of each resource', async () => {
    const { result } = await renderSkillsScreen()
    const before = { ...requests }

    await act(async () => {
      await result.current.membership.addSkills([2, 3])
    })

    await waitFor(() => expect(counterOf(result.current.skills.skills, 3)).toBe(1))
    expect(requests.skills - before.skills).toBe(1)
    expect(requests.skillGroups - before.skillGroups).toBe(1)
    expect(requests.skillGroupSkills - before.skillGroupSkills).toBe(1)
  })
})
