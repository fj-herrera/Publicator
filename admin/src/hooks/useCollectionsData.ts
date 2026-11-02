import { useMemo } from 'react'
import type { Asset, PublicationAssetTarget } from '../entities/asset'
import type {
  Collection,
  CollectionAsset,
  PublicationContextLink,
} from '../entities/collection'
import { getAssets, getPublications } from '../services/assets.service'
import {
  getCollectionAssets,
  getCollections,
  getPublicationContexts,
} from '../services/collections.service'
import { apiMessages } from '../constants/api-messages'
import useResource from './useResource'

export type CollectionsData = {
  collections: Collection[]
  collectionAssets: CollectionAsset[]
  contexts: PublicationContextLink[]
  assets: Asset[]
  publications: PublicationAssetTarget[]
}

const loadFailed = apiMessages.collections.loadFailed

function useCollectionsData() {
  const collections = useResource('collections', getCollections, loadFailed)
  const collectionAssets = useResource('collectionAssets', getCollectionAssets, loadFailed)
  const contexts = useResource('publicationContexts', getPublicationContexts, loadFailed)
  const assets = useResource('assets', getAssets, loadFailed)
  const publications = useResource('publications', getPublications, loadFailed)
  const parts = [collections, collectionAssets, contexts, assets, publications]

  const data = useMemo<CollectionsData | null>(() => {
    if (
      !collections.data || !collectionAssets.data || !contexts.data
      || !assets.data || !publications.data
    ) {
      return null
    }

    return {
      collections: collections.data,
      collectionAssets: collectionAssets.data,
      contexts: contexts.data,
      assets: assets.data,
      publications: publications.data,
    }
  }, [collections.data, collectionAssets.data, contexts.data, assets.data, publications.data])

  return {
    data,
    isLoading: parts.some((part) => part.isLoading),
    isRefreshing: parts.some((part) => part.isRefreshing),
    error: parts.find((part) => part.error)?.error ?? '',
  }
}

export default useCollectionsData
