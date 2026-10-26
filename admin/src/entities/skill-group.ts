export type SkillGroupSkill = {
  id: number
  name: string
  icon: string | null
}

export type SkillGroup = {
  id: number
  name: string
  description: string | null
  skills: SkillGroupSkill[]
  inPublications: number
}

export type SkillGroupInput = {
  name: string
  description: string | null
}