import type { Asset, PublicationAssetRelation } from './asset'
import type { Client } from './client'
import type { Collection, CollectionAsset, PublicationContextLink } from './collection'
import type { Context } from './context'
import type { Skill } from './skill'
import type { Tag } from './tag'
import type { Type } from './type'

export type PublicationRecord = {
  id: number
  type: Pick<Type, 'id' | 'name'>
  meta: {
    id: number
    title: string
    slug: string
    date: string
    status: string
    client: Pick<Client, 'id' | 'name' | 'logo'> | null
  }
}

export type PublicationMetaRecord = PublicationRecord['meta']

export type PublicationContextRecord = PublicationContextLink & {
  visible: boolean
  featured: boolean
  position: number
}

export type PublicationTagRecord = {
  id: number
  publication: { id: number }
  tag: Pick<Tag, 'id' | 'name'>
}

export type PublicationSkillGroupRecord = {
  id: number
  publication: { id: number }
  skillGroup: { id: number; name: string }
}

export type SkillGroupSkillRecord = {
  id: number
  skillGroup: { id: number }
  skill: Pick<Skill, 'id' | 'name' | 'icon'>
}

export type PublicationAssetRecord = PublicationAssetRelation & {
  asset: Asset
}

export type PublicationListData = {
  publications: PublicationRecord[]
  metas: PublicationMetaRecord[]
  contexts: Pick<Context, 'id' | 'name'>[]
  types: Pick<Type, 'id' | 'name'>[]
  clients: Client[]
  tags: Pick<Tag, 'id' | 'name'>[]
  publicationContexts: PublicationContextRecord[]
  publicationTags: PublicationTagRecord[]
  publicationSkillGroups: PublicationSkillGroupRecord[]
  skillGroupSkills: SkillGroupSkillRecord[]
  publicationAssets: PublicationAssetRecord[]
  collections: Collection[]
  collectionAssets: CollectionAsset[]
}
