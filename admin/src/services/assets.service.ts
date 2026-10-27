import { getApiError } from './api-error'
import type {
  Asset,
  AssetCollectionRelation,
  CollectionAssetTarget,
  PublicationAssetTarget,
  PublicationAssetRelation,
} from '../entities/asset'

async function getList<T>(path: string, fallback: string): Promise<T[]> {
  const response = await fetch(path)

  if (!response.ok) {
    throw await getApiError(response, fallback)
  }

  return response.json() as Promise<T[]>
}

export function getAssets() {
  return getList<Asset>('/api/assets', 'Could not load assets.')
}

export async function updateAssetName(id: number, name: string): Promise<Asset> {
  const response = await fetch(`/api/assets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw await getApiError(response, 'Could not update asset.')
  }

  return response.json() as Promise<Asset>
}

export function getPublicationAssets() {
  return getList<PublicationAssetRelation>(
    '/api/publication-assets',
    'Could not load publication relations.',
  )
}

export function getAssetCollections() {
  return getList<AssetCollectionRelation>(
    '/api/asset-collections',
    'Could not load collection relations.',
  )
}

export async function updatePublicationAssetRole(id: number, role: string) {
  const response = await fetch(`/api/publication-assets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  if (!response.ok) {
    throw await getApiError(response, 'Could not update publication asset role.')
  }

  return response.json()
}

export function getPublications() {
  return getList<PublicationAssetTarget>(
    '/api/publications',
    'Could not load publications.',
  )
}

export function getCollections() {
  return getList<CollectionAssetTarget>(
    '/api/collections',
    'Could not load collections.',
  )
}

export async function uploadAssets(files: File[]): Promise<Asset[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch('/api/media/assets', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw await getApiError(response, 'Could not upload assets.')
  }

  return response.json() as Promise<Asset[]>
}

export async function createPublicationAsset(
  assetId: number,
  publicationId: number,
  role: string,
) {
  const response = await fetch('/api/publication-assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetId, publicationId, role }),
  })

  if (!response.ok) {
    throw await getApiError(response, 'Could not associate asset with publication.')
  }

  return response.json()
}

export async function createAssetCollection(
  assetId: number,
  collectionId: number,
  role: string,
) {
  const response = await fetch('/api/asset-collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetId, collectionId, role }),
  })

  if (!response.ok) {
    throw await getApiError(response, 'Could not associate asset with collection.')
  }

  return response.json()
}