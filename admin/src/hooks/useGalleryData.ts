import { useMemo } from 'react'
import type {
  Asset,
  AssetCollectionRelation,
  PublicationAssetRelation,
} from '../entities/asset'
import type { AssetText } from '../entities/asset-text'
import {
  getAssetCollections,
  getAssets,
  getPublicationAssets,
  getPublications,
} from '../services/assets.service'
import { getAssetTexts } from '../services/asset-texts.service'
import useResource from './useResource'

export type AssetRelations = {
  publications: PublicationAssetRelation[]
  collections: AssetCollectionRelation[]
}

const loadFailed = 'Could not load assets.'

function groupBy<T>(items: T[], getId: (item: T) => number) {
  const grouped = new Map<number, T[]>()
  items.forEach((item) => {
    const id = getId(item)
    grouped.set(id, [...(grouped.get(id) ?? []), item])
  })
  return grouped
}

// Every list is its own resource: a write reloads only the lists it affects,
// whichever gallery tab is showing.
function useGalleryData() {
  const assets = useResource<Asset[]>('assets', getAssets, loadFailed)
  const publicationAssets = useResource('publicationAssets', getPublicationAssets, loadFailed)
  const collectionAssets = useResource('collectionAssets', getAssetCollections, loadFailed)
  const publications = useResource('publications', getPublications, loadFailed)
  const assetTexts = useResource<AssetText[]>('assetTexts', getAssetTexts, loadFailed)
  const parts = [assets, publicationAssets, collectionAssets, publications, assetTexts]

  const loadedAssets = useMemo(() => assets.data ?? [], [assets.data])
  const relations = useMemo(() => {
    const byPublication = groupBy(publicationAssets.data ?? [], (item) => item.asset.id)
    const byCollection = groupBy(collectionAssets.data ?? [], (item) => item.asset.id)
    const next: Record<number, AssetRelations> = {}

    loadedAssets.forEach((asset) => {
      next[asset.id] = {
        publications: byPublication.get(asset.id) ?? [],
        collections: byCollection.get(asset.id) ?? [],
      }
    })
    return next
  }, [loadedAssets, publicationAssets.data, collectionAssets.data])
  const loadedPublications = useMemo(() => publications.data ?? [], [publications.data])
  const textsByAsset = useMemo(() => {
    const grouped: Record<number, AssetText[]> = {}
    groupBy(assetTexts.data ?? [], (item) => item.asset.id).forEach((items, id) => {
      grouped[id] = items
    })
    return grouped
  }, [assetTexts.data])

  return {
    assets: loadedAssets,
    publications: loadedPublications,
    relations,
    assetTexts: textsByAsset,
    isLoading: parts.some((part) => part.isLoading),
    isRefreshing: parts.some((part) => part.isRefreshing),
    error: parts.find((part) => part.error)?.error ?? '',
    retry: () => parts.forEach((part) => {
      if (part.error) part.retry()
    }),
  }
}

export default useGalleryData
