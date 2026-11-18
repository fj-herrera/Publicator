import type { PublicationRelationDraft } from '../components/assets/PublicationRelationDrafts'
import type { AssetText, AssetTextDraft } from '../entities/asset-text'
import {
  createPublicationAsset,
  updateAssetName,
  updatePublicationAssetRole,
} from './assets.service'
import { saveAssetTextDrafts } from './asset-texts.service'
import { invalidate, type ResourceName } from '../state/resource-invalidation'

type PublicationRole = {
  id: number
  role: string
}

type SaveGalleryAssetEditInput = {
  assetId: number
  originalName: string | null | undefined
  assetName: string
  publicationRoles: PublicationRole[]
  editedPublicationRoles: Record<number, string>
  newPublicationRelations: PublicationRelationDraft[]
  assetTextDrafts: AssetTextDraft[]
  currentAssetTexts: AssetText[]
}

export type SaveGalleryAssetEditResult = {
  trimmedName: string
  savedRoles: Record<number, string>
  failedDraftKeys: Set<number>
  textResult: Awaited<ReturnType<typeof saveAssetTextDrafts>>
  hasSaveFailures: boolean
}

export async function saveGalleryAssetEdit({
  assetId,
  originalName,
  assetName,
  publicationRoles,
  editedPublicationRoles,
  newPublicationRelations,
  assetTextDrafts,
  currentAssetTexts,
}: SaveGalleryAssetEditInput): Promise<SaveGalleryAssetEditResult> {
  const trimmedName = assetName.trim()
  const trimmedRoles = Object.fromEntries(
    publicationRoles.map(({ id }) => [id, editedPublicationRoles[id]?.trim() ?? '']),
  )

  const updatedAsset = await updateAssetName(assetId, trimmedName)
  const changedRoles = publicationRoles.filter(
    (relation) => trimmedRoles[relation.id] !== relation.role,
  )
  const roleResults = await Promise.allSettled(changedRoles.map((relation) => (
    updatePublicationAssetRole(relation.id, trimmedRoles[relation.id])
  )))
  const relationResults = await Promise.allSettled(newPublicationRelations.map((relation) => (
    createPublicationAsset(
      assetId,
      Number(relation.publicationId),
      relation.role.trim(),
    )
  )))
  const savedRoles: Record<number, string> = {}
  changedRoles.forEach((relation, index) => {
    if (roleResults[index].status === 'fulfilled') {
      savedRoles[relation.id] = trimmedRoles[relation.id]
    }
  })
  const failedDraftKeys = new Set<number>()
  relationResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      failedDraftKeys.add(newPublicationRelations[index].key)
    }
  })
  const textResult = await saveAssetTextDrafts(assetId, assetTextDrafts, currentAssetTexts)
  const hasSaveFailures = textResult.failures.size > 0
    || failedDraftKeys.size > 0
    || roleResults.some((result) => result.status === 'rejected')

  const written = new Set<ResourceName>()
  if (updatedAsset.name !== originalName) written.add('assets')
  if (
    Object.keys(savedRoles).length > 0
    || relationResults.some((result) => result.status === 'fulfilled')
  ) {
    written.add('publicationAssets')
  }
  if (textResult.hasChanges) written.add('assetTexts')
  if (written.size > 0) invalidate(...written)

  return {
    trimmedName,
    savedRoles,
    failedDraftKeys,
    textResult,
    hasSaveFailures,
  }
}
