import type { Skill, SkillInput } from '../entities/skill'
import type { SkillGroup, SkillGroupInput } from '../entities/skill-group'
import type { SkillGroupSkill } from '../entities/skill-group-skill'

type StoredSkill = { id: number; name: string; icon: string | null }
type StoredGroup = { id: number; name: string; description: string | null }
type StoredMembership = { id: number; groupId: number; skillId: number }

// In-memory stand-in for the API that reproduces its server-side behaviour:
// derived counters, a cascade on group deletion and a 409 when deleting a skill
// that still belongs to a group.
let skills: StoredSkill[] = []
let groups: StoredGroup[] = []
let memberships: StoredMembership[] = []
let nextId = 1

export const requests = { skills: 0, skillGroups: 0, skillGroupSkills: 0 }

export function resetBackend(seed: {
  skills?: StoredSkill[]
  groups?: StoredGroup[]
  memberships?: StoredMembership[]
} = {}) {
  skills = seed.skills ?? []
  groups = seed.groups ?? []
  memberships = seed.memberships ?? []
  nextId = 1000
  requests.skills = 0
  requests.skillGroups = 0
  requests.skillGroupSkills = 0
}

const toSkill = (skill: StoredSkill): Skill => ({
  ...skill,
  inSkillGroups: memberships.filter((membership) => membership.skillId === skill.id).length,
})

export const skillsService = {
  getSkills: async (): Promise<Skill[]> => {
    requests.skills++
    return skills.map(toSkill)
  },
  createSkillRequest: async (input: SkillInput) => {
    const skill = { id: nextId++, ...input }
    skills.push(skill)
    return skill
  },
  updateSkillRequest: async (id: number, input: SkillInput) => {
    skills = skills.map((skill) => (skill.id === id ? { ...skill, ...input } : skill))
    return skills.find((skill) => skill.id === id)!
  },
  deleteSkillRequest: async (id: number) => {
    if (memberships.some((membership) => membership.skillId === id)) {
      throw new Error('This skill cannot be deleted while it belongs to a skill group.')
    }
    skills = skills.filter((skill) => skill.id !== id)
  },
}

export const skillGroupsService = {
  getSkillGroups: async (): Promise<SkillGroup[]> => {
    requests.skillGroups++
    return groups.map((group) => ({
      ...group,
      skills: memberships
        .filter((membership) => membership.groupId === group.id)
        .map((membership) => skills.find((skill) => skill.id === membership.skillId)!)
        .map(({ id, name, icon }) => ({ id, name, icon })),
      inPublications: 0,
    }))
  },
  createSkillGroupRequest: async (input: SkillGroupInput) => {
    const group = { id: nextId++, ...input }
    groups.push(group)
    return group
  },
  updateSkillGroupRequest: async (id: number, input: SkillGroupInput) => {
    groups = groups.map((group) => (group.id === id ? { ...group, ...input } : group))
    return groups.find((group) => group.id === id)!
  },
  deleteSkillGroupRequest: async (id: number) => {
    groups = groups.filter((group) => group.id !== id)
    memberships = memberships.filter((membership) => membership.groupId !== id)
  },
}

export const skillGroupSkillsService = {
  getSkillGroupSkills: async (): Promise<SkillGroupSkill[]> => {
    requests.skillGroupSkills++
    return memberships.map((membership) => ({
      id: membership.id,
      skillGroup: { id: membership.groupId },
      skill: toSkill(skills.find((skill) => skill.id === membership.skillId)!),
    }))
  },
  addSkillToGroupRequest: async (skillGroupId: number, skillId: number) => {
    const membership = { id: nextId++, groupId: skillGroupId, skillId }
    memberships.push(membership)
    return {
      id: membership.id,
      skillGroup: { id: skillGroupId },
      skill: toSkill(skills.find((skill) => skill.id === skillId)!),
    }
  },
  removeSkillFromGroupRequest: async (id: number) => {
    memberships = memberships.filter((membership) => membership.id !== id)
  },
}
