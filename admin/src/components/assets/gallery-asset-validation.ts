import type { AssetTextDraft } from '../../entities/asset-text'
import type { PublicationRelationDraft } from './PublicationRelationDrafts'

type ExistingPublicationRole = {
  id: number
  publicationId: number
  role: string
}

type ValidateAssetEditInput = {
  assetName: string
  publicationRoles: ExistingPublicationRole[]
  editedPublicationRoles: Record<number, string>
  newPublicationRelations: PublicationRelationDraft[]
  assetTextDrafts: AssetTextDraft[]
}

export function getAssetEditValidationError({
  assetName,
  publicationRoles,
  editedPublicationRoles,
  newPublicationRelations,
  assetTextDrafts,
}: ValidateAssetEditInput): string | null {
  const trimmedName = assetName.trim()
  if (!trimmedName || trimmedName.length > 255) {
    return 'Enter a file name of 1 to 255 characters.'
  }

  const trimmedRoles = Object.fromEntries(
    publicationRoles.map(({ id }) => [id, editedPublicationRoles[id]?.trim() ?? '']),
  )

  if (Object.values(trimmedRoles).some((role) => !role)) {
    return 'Every publication association must have a role.'
  }

  if (Object.values(trimmedRoles).some((role) => role.length > 50)) {
    return 'Roles can contain up to 50 characters.'
  }

  if (newPublicationRelations.some((relation) => (
    !relation.publicationId || !relation.role.trim() || relation.role.trim().length > 50
  ))) {
    return 'Choose a publication and a role for each new relation.'
  }

  const activeTextDrafts = assetTextDrafts.filter((draft) => !draft.isRemoved)
  if (activeTextDrafts.some((draft) => !draft.role.trim() || !draft.text.trim())) {
    return 'Every text needs a role and some content.'
  }

  if (activeTextDrafts.some((draft) => draft.role.trim().length > 50)) {
    return 'Text roles can contain up to 50 characters.'
  }

  const relationKeys = new Set<string>()
  for (const relation of publicationRoles) {
    const key = `${relation.publicationId}:${trimmedRoles[relation.id].toLowerCase()}`
    if (relationKeys.has(key)) {
      return 'This publication cannot have duplicate roles for the same asset.'
    }
    relationKeys.add(key)
  }

  for (const relation of newPublicationRelations) {
    const key = `${relation.publicationId}:${relation.role.trim().toLowerCase()}`
    if (relationKeys.has(key)) {
      return 'This publication already has an association with that role.'
    }
    relationKeys.add(key)
  }

  return null
}
