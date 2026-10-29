import { useEffect, useState } from 'react'
import type { Asset, PublicationAssetTarget } from '../entities/asset'
import type {
  Collection,
  CollectionAsset,
  PublicationContextLink,
} from '../entities/collection'
import { getErrorMessage } from '../services/api-error'
import { getAssets, getPublications } from '../services/assets.service'
import {
  getCollectionAssets,
  getCollections,
  getPublicationContexts,
} from '../services/collections.service'
import { apiMessages } from '../constants/api-messages'

export type CollectionsData = {
  collections: Collection[]
  collectionAssets: CollectionAsset[]
  contexts: PublicationContextLink[]
  assets: Asset[]
  publications: PublicationAssetTarget[]
}

function useCollectionsData() {
  const [data, setData] = useState<CollectionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const load = async () => {
      try {
        const [collections, collectionAssets, contexts, assets, publications] = await Promise.all([
          getCollections(),
          getCollectionAssets(),
          getPublicationContexts(),
          getAssets(),
          getPublications(),
        ])

        if (isCurrent) {
          setData({ collections, collectionAssets, contexts, assets, publications })
          setError('')
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, apiMessages.collections.loadFailed))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isCurrent = false
    }
  }, [reloadCount])

  return { data, isLoading, error, reload: () => setReloadCount((count) => count + 1) }
}

export default useCollectionsData
