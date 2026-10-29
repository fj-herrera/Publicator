import { apiMessages } from '../constants/api-messages'
import type {
  Collection,
  CollectionAsset,
  CollectionAssetDraft,
  PublicationContextLink,
} from '../entities/collection'
import { getErrorMessage } from './api-error'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export function getCollections() {
  return requestJson<Collection[]>('/api/collections', apiMessages.collections.loadFailed)
}

export function getCollectionAssets() {
  return requestJson<CollectionAsset[]>('/api/asset-collections', apiMessages.collections.loadFailed)
}

export function getPublicationContexts() {
  return requestJson<PublicationContextLink[]>(
    '/api/publication-contexts',
    apiMessages.collections.loadFailed,
  )
}

export function createCollectionRequest(publicationId: number, type: string) {
  return requestJson<{ id: number }>(
    '/api/collections',
    apiMessages.collections.createFailed,
    jsonRequest('POST', { publicationId, type }),
  )
}

export function updateCollectionTypeRequest(id: number, type: string) {
  return requestJson<{ id: number }>(
    `/api/collections/${id}`,
    apiMessages.collections.updateFailed,
    jsonRequest('PATCH', { type }),
  )
}

export function deleteCollectionRequest(id: number) {
  return requestVoid(
    `/api/collections/${id}`,
    apiMessages.collections.deleteFailed,
    { method: 'DELETE' },
  )
}

export function reorderCollectionsRequest(publicationId: number, ids: number[]) {
  return requestJson<Collection[]>(
    '/api/collections/order',
    apiMessages.collections.reorderFailed,
    jsonRequest('PATCH', { publicationId, ids }),
  )
}

function reorderCollectionAssetsRequest(collectionId: number, ids: number[]) {
  return requestJson<CollectionAsset[]>(
    '/api/asset-collections/order',
    apiMessages.collections.reorderFailed,
    jsonRequest('PATCH', { collectionId, ids }),
  )
}

function createCollectionAssetRequest(collectionId: number, assetId: number, role: string) {
  return requestJson<{ id: number }>(
    '/api/asset-collections',
    apiMessages.collections.assetFailed,
    jsonRequest('POST', { collectionId, assetId, role }),
  )
}

function updateCollectionAssetRoleRequest(id: number, role: string) {
  return requestJson<{ id: number }>(
    `/api/asset-collections/${id}`,
    apiMessages.collections.assetFailed,
    jsonRequest('PATCH', { role }),
  )
}

// Removing only deletes the association, never the asset.
function deleteCollectionAssetRequest(id: number) {
  return requestVoid(
    `/api/asset-collections/${id}`,
    apiMessages.collections.assetFailed,
    { method: 'DELETE' },
  )
}

export type SaveCollectionAssetsResult = {
  failures: Map<number, string>
  // Association id given to each new draft that was saved.
  createdIds: Map<number, number>
  orderError: string
}

export async function saveCollectionAssetDrafts(
  collectionId: number,
  drafts: CollectionAssetDraft[],
  current: CollectionAsset[],
): Promise<SaveCollectionAssetsResult> {
  const currentById = new Map(current.map((item) => [item.id, item]))
  const failures = new Map<number, string>()
  const createdIds = new Map<number, number>()
  // Final id of every draft whose association exists on the server after this save.
  const existingIds = new Map<number, number>()

  for (const draft of drafts) {
    const original = draft.id === null ? undefined : currentById.get(draft.id)
    const role = draft.role.trim()

    try {
      if (draft.isRemoved) {
        if (original) {
          await deleteCollectionAssetRequest(original.id)
        }
        continue
      }

      if (!original) {
        const created = await createCollectionAssetRequest(collectionId, draft.asset.id, role)
        existingIds.set(draft.key, created.id)
        createdIds.set(draft.key, created.id)
        continue
      }

      existingIds.set(draft.key, original.id)
      if (role !== original.role) {
        await updateCollectionAssetRoleRequest(original.id, role)
      }
    } catch (error) {
      failures.set(draft.key, getErrorMessage(error, apiMessages.collections.assetFailed))
      // A failed removal leaves the association in place, so it still counts for the order.
      if (draft.isRemoved && original) {
        existingIds.set(draft.key, original.id)
      }
    }
  }

  const orderedIds = drafts
    .filter((draft) => existingIds.has(draft.key))
    .map((draft) => existingIds.get(draft.key)!)
  const serverOrder = [...currentById.values()]
    .filter((item) => orderedIds.includes(item.id))
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id)
  const isOrderUnchanged = orderedIds.length === serverOrder.length
    && orderedIds.every((id, index) => id === serverOrder[index])

  if (orderedIds.length === 0 || isOrderUnchanged) {
    return { failures, createdIds, orderError: '' }
  }

  try {
    await reorderCollectionAssetsRequest(collectionId, orderedIds)
    return { failures, createdIds, orderError: '' }
  } catch (error) {
    return {
      failures,
      createdIds,
      orderError: getErrorMessage(error, apiMessages.collections.reorderFailed),
    }
  }
}
