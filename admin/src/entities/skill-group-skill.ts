import type { Skill } from './skill'

export type SkillGroupSkill = {
  id: number
  skillGroup: { id: number }
  skill: Skill
}