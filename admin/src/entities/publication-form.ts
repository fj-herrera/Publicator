import type { Client } from './client'
import type { Asset, PublicationAssetRelation } from './asset'
import type { Collection } from './collection'
import type { Context } from './context'
import type { SkillGroup } from './skill-group'
import type { Tag } from './tag'
import type { Type } from './type'
import type { PublicationTextRecord, PublicationTextValues } from './publication-text'

export const publicationFormSections = ['mainInfo', 'assets', 'texts'] as const

export type PublicationFormSectionId = typeof publicationFormSections[number]

// Prepared state for one PublicationContext association; not persisted yet.
export type PublicationContextDraft = {
  id: number | null
  contextId: number
  visible: boolean
  featured: boolean
  position: number
}

export type MainInfoValues = {
  title: string
  slug: string
  slugEditedManually: boolean
  typeId: number | null
  clientId: number | null
  contexts: PublicationContextDraft[]
  tagIds: number[]
  skillGroupIds: number[]
  // Editorial status; not editable from Main Info.
  status: string
}

export type DirectAssetUploadDraft = {
  key: number
  file: File
  role: string
  asset: Asset | null
  error: string
  isUploading: boolean
}

export type DirectPublicationAssetDraft = PublicationAssetRelation & {
  asset: Asset
}

export type AssetsValues = {
  collectionIds: number[]
  directAssets: DirectPublicationAssetDraft[]
  pendingUploads: DirectAssetUploadDraft[]
  uploadRole: string
  pendingOperations: number
}

export type TextsValues = PublicationTextValues

export type PublicationFormValues = {
  mainInfo: MainInfoValues
  assets: AssetsValues
  texts: TextsValues
}

export type MainInfoErrors = Partial<Record<'title' | 'slug' | 'typeId' | 'contexts', string>>
export type SectionErrors = Partial<Record<string, string>>

export type PublicationFormErrors = {
  mainInfo: MainInfoErrors
  assets: SectionErrors
  texts: SectionErrors
}

export type PublicationFormCatalogs = {
  types: Pick<Type, 'id' | 'name'>[]
  clients: Pick<Client, 'id' | 'name'>[]
  contexts: Pick<Context, 'id' | 'name'>[]
  tags: Pick<Tag, 'id' | 'name'>[]
  skillGroups: Pick<SkillGroup, 'id' | 'name' | 'description' | 'skills'>[]
  collections: Collection[]
  publicationRoles: string[]
  lastContextPosition: Record<number, number>
}

export type PublicationFormData = {
  publicationId: number | null
  metaId: number | null
  publicationTexts: PublicationTextRecord[]
  catalogs: PublicationFormCatalogs
  initialValues: PublicationFormValues
}
