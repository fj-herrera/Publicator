import { jsonRequest, requestJson, requestVoid } from './api-request'
import type {
  Asset,
  AssetCollectionRelation,
  CollectionAssetTarget,
  PublicationAssetTarget,
  PublicationAssetRelation,
} from '../entities/asset'

export function getAssets() {
  return requestJson<Asset[]>('/api/assets', 'Could not load assets.')
}

export async function updateAssetName(id: number, name: string): Promise<Asset> {
  return requestJson(`/api/assets/${id}`, 'Could not update asset.', jsonRequest('PATCH', { name }))
}

export async function deleteAsset(id: number): Promise<void> {
  return requestVoid(`/api/assets/${id}`, 'Could not delete asset.', { method: 'DELETE' })
}

export function getPublicationAssets() {
  return requestJson<PublicationAssetRelation[]>(
    '/api/publication-assets',
    'Could not load publication relations.',
  )
}

export function getAssetCollections() {
  return requestJson<AssetCollectionRelation[]>(
    '/api/asset-collections',
    'Could not load collection relations.',
  )
}

export async function updatePublicationAssetRole(id: number, role: string) {
  return requestJson<unknown>(
    `/api/publication-assets/${id}`,
    'Could not update publication asset role.',
    jsonRequest('PATCH', { role }),
  )
}

export function getPublications() {
  return requestJson<PublicationAssetTarget[]>(
    '/api/publications',
    'Could not load publications.',
  )
}

export function getCollections() {
  return requestJson<CollectionAssetTarget[]>(
    '/api/collections',
    'Could not load collections.',
  )
}

export async function uploadAssets(files: File[]): Promise<Asset[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  return requestJson('/api/media/assets', 'Could not upload assets.', {
    method: 'POST',
    body: formData,
  })
}

export async function createPublicationAsset(
  assetId: number,
  publicationId: number,
  role: string,
) {
  return requestJson<unknown>(
    '/api/publication-assets',
    'Could not associate asset with publication.',
    jsonRequest('POST', { assetId, publicationId, role }),
  )
}

export async function createAssetCollection(
  assetId: number,
  collectionId: number,
  role: string,
) {
  return requestJson<unknown>(
    '/api/asset-collections',
    'Could not associate asset with collection.',
    jsonRequest('POST', { assetId, collectionId, role }),
  )
}
