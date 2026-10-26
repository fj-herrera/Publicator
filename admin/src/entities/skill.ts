export type Skill = {
  id: number
  name: string
  icon: string | null
  inSkillGroups: number
}

export type SkillInput = {
  name: string
  icon: string | null
}