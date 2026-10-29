import type { Asset } from './asset'

export interface CollectionClient {
  id: number
  name: string
}

export interface Collection {
  id: number
  type: string
  position: number
  publication: {
    id: number
    meta: {
      title: string
      slug: string
      date: string
      client: CollectionClient | null
    }
  }
}

export interface CollectionAsset {
  id: number
  role: string
  position: number
  collection: { id: number }
  asset: Asset
}

export interface PublicationContextLink {
  id: number
  publication: { id: number }
  context: { id: number; name: string }
}

export interface CollectionRow extends Collection {
  contexts: { id: number; name: string }[]
  assets: CollectionAsset[]
  isFirst: boolean
  isLast: boolean
}

export interface CollectionAssetDraft {
  key: number
  // null until the association has been saved.
  id: number | null
  asset: Asset
  role: string
  isRemoved: boolean
  error?: string
}
